/**
 * Chorus yük testi: N sanal katılımcı bağlanır, aynı slayta oy verir.
 * Ölçülenler: bağlanma süresi, oy ack gecikmesi (p50/p95/max), batch yayın sayısı,
 * sunucu belleği (RSS) ve CPU süresi (/health üzerinden), son sayımların tutarlılığı.
 *
 * Kullanım: node scripts/load-test.mjs --participants 300 --api http://localhost:4000
 */
import { io } from 'socket.io-client';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), all[i + 1]]);
    return acc;
  }, []),
);
const API = args.api ?? 'http://localhost:4000';
const N = Number(args.participants ?? 300);
const BATCH = Number(args.batch ?? 50);
const VOTE_WINDOW_MS = Number(args.window ?? 2000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const percentile = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0);

async function http(method, path, body, key) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(key ? { 'x-host-key': key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

function connect() {
  return new Promise((resolve, reject) => {
    const s = io(API, { transports: ['websocket'], forceNew: true, reconnection: false });
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });
}

function emit(socket, event, data) {
  return new Promise((resolve) => {
    const started = performance.now();
    socket.timeout(10_000).emit(event, data, (err, res) => {
      resolve({ err, res, ms: performance.now() - started });
    });
  });
}

async function main() {
  console.log(`Chorus load test: ${N} participants against ${API}`);

  const before = await http('GET', '/health');

  // 1) Sunum ve oda hazırla
  const pres = await http('POST', '/presentations', {
    title: 'Load test',
    slides: [
      { type: 'multiple_choice', question: 'Load test question', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
    ],
  });
  const room = await http('POST', `/presentations/${pres.id}/rooms`, undefined, pres.hostKey);

  // 2) Host katılır, slaytı açar ve oylamayı başlatır
  const host = await connect();
  const hostJoin = await emit(host, 'room:join', { code: room.code, role: 'host', hostKey: pres.hostKey });
  if (!hostJoin.res?.ok) throw new Error('host join failed');
  await emit(host, 'host:setSlide', { slideIndex: 0 });
  await emit(host, 'host:toggleVoting', { open: true });

  const batchPublications = [];
  host.on('results:update', () => batchPublications.push(performance.now()));

  // 3) Katılımcıları kademeli bağlan (ani bağlantı fırtınası yerine partiler halinde)
  const joinStart = performance.now();
  const participants = [];
  for (let i = 0; i < N; i += BATCH) {
    const chunk = await Promise.all(
      Array.from({ length: Math.min(BATCH, N - i) }, async () => {
        const s = await connect();
        const j = await emit(s, 'room:join', { code: room.code, role: 'participant' });
        if (!j.res?.ok) throw new Error(`join failed: ${JSON.stringify(j.res?.error)}`);
        return s;
      }),
    );
    participants.push(...chunk);
  }
  const joinMs = performance.now() - joinStart;

  // 4) Oylar: her katılımcı rastgele bir an seçer ve oy verir
  const latencies = [];
  const counts = { a: 0, b: 0 };
  const voteStart = performance.now();
  await Promise.all(
    participants.map(async (s, i) => {
      await sleep(Math.random() * VOTE_WINDOW_MS);
      const optionId = i % 3 === 0 ? 'b' : 'a';
      const r = await emit(s, 'vote:submit', { payload: { type: 'multiple_choice', optionId } });
      if (r.res?.ok) {
        latencies.push(r.ms);
        counts[optionId]++;
      }
    }),
  );
  const voteMs = performance.now() - voteStart;
  await sleep(600); // son batch penceresinin yayınlanması için

  // 5) Sonuç tutarlılığı: host son sayımları almış olmalı
  const hostJoinRes = await emit(host, 'room:join', { code: room.code, role: 'host', hostKey: pres.hostKey });
  const finalCounts = hostJoinRes.res?.snapshot?.results?.counts ?? {};
  const total = Object.values(finalCounts).reduce((a, b) => a + b, 0);

  const after = await http('GET', '/health');
  const sorted = [...latencies].sort((a, b) => a - b);

  const report = {
    participants: N,
    joinedAllMs: Math.round(joinMs),
    votesAccepted: latencies.length,
    voteWindowMs: Math.round(voteMs),
    voteAckLatencyMs: {
      p50: Math.round(percentile(sorted, 50)),
      p95: Math.round(percentile(sorted, 95)),
      max: Math.round(sorted.at(-1) ?? 0),
    },
    resultBatchesPublished: batchPublications.length,
    finalCountsMatchVotes: total === latencies.length && finalCounts.a === counts.a && finalCounts.b === counts.b,
    serverRssMb: { before: before.memory.rssMb, after: after.memory.rssMb },
    serverCpuSecondsUsed: Math.round((after.cpuSeconds - before.cpuSeconds) * 100) / 100,
  };

  console.log(JSON.stringify(report, null, 2));

  for (const s of participants) s.disconnect();
  host.disconnect();
  process.exit(report.finalCountsMatchVotes ? 0 : 1);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
