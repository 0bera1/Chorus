'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HOME_URL } from '@/lib/config';
import { T, errorMessageFor } from '@/lib/strings';
import { useRoom, type ConnState } from '@/lib/use-room';
import { Logo } from './logo';
import { ResultsChart } from './results';
import { QaPanel, VoteInput } from './participant-input';

/** Katılımcı telefon ekranı: tek sütun, büyük dokunma alanları. */
export function ParticipantView({ code }: { code: string }) {
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const { state, actions } = useRoom({ code, role: 'participant', nickname, enabled: joined });

  if (!joined) {
    return (
      <Shell code={code} conn="connecting" count={null}>
        <JoinForm nickname={nickname} onNickname={setNickname} onJoin={() => setJoined(true)} />
      </Shell>
    );
  }

  if (state.ended) {
    return (
      <Shell code={code} conn="connected" count={null}>
        <RedirectCard title={T.ended.title} body={T.ended.body} />
      </Shell>
    );
  }

  if (state.errorCode) {
    const notFound = state.errorCode === 'not_found';
    const ended = state.errorCode === 'room_ended';
    const title = notFound ? T.errors.notFound : ended ? T.errors.roomEnded : T.errors.generic;
    const body = notFound ? T.errors.notFoundBody : ended ? T.errors.roomEndedBody : errorMessageFor(state.errorCode);
    return (
      <Shell code={code} conn="error" count={null}>
        {ended ? <RedirectCard title={title} body={body} /> : <Card title={title} body={body} />}
      </Shell>
    );
  }

  const slide = state.slide;
  const conn: ConnState = state.status === null ? 'connecting' : state.conn;

  return (
    <Shell code={code} conn={conn} count={state.participantCount}>
      {!slide && <WaitingCard />}

      {slide && slide.type === 'qa' && (
        <section className="flex flex-col gap-5" aria-labelledby="question">
          <Question id="question" text={slide.question} />
          <QaPanel
            questions={state.results?.slideId === slide.id && state.results.data.type === 'qa' ? state.results.data.questions : []}
            onAsk={actions.ask}
            onUpvote={actions.upvote}
          />
        </section>
      )}

      {slide && slide.type !== 'qa' && (
        <section className="flex flex-col gap-6" aria-labelledby="question">
          <Question id="question" text={slide.question} />
          {slide.settings.votingOpen ? (
            <VoteInput slide={slide} myVote={state.myVote} onVote={actions.vote} />
          ) : (
            <Card title={T.vote.closed} body={T.vote.closedBody} />
          )}
          {slide.settings.showResults && state.results?.slideId === slide.id && (
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <ResultsChart slide={slide} results={state.results.data} />
            </div>
          )}
        </section>
      )}
    </Shell>
  );
}

function Shell({
  code,
  conn,
  count,
  children,
}: {
  code: string;
  conn: ConnState;
  count: number | null;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-bold tracking-tight">{T.brand}</span>
          <span className="text-sm text-muted tabular-nums">{code}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {count !== null && (
            <span className="text-muted tabular-nums" aria-live="polite">
              {count} {T.present.participants}
            </span>
          )}
          <ConnPill conn={conn} />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

function ConnPill({ conn }: { conn: ConnState }) {
  const label =
    conn === 'connected' ? T.conn.connected : conn === 'reconnecting' ? T.conn.reconnecting : conn === 'error' ? T.conn.error : T.conn.connecting;
  const dot = conn === 'connected' ? 'bg-success' : conn === 'error' ? 'bg-red-500' : 'bg-accent animate-pulse';
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium" role="status">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

function JoinForm({
  nickname,
  onNickname,
  onJoin,
}: {
  nickname: string;
  onNickname: (v: string) => void;
  onJoin: () => void;
}) {
  return (
    <form
      className="flex flex-1 flex-col justify-center gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onJoin();
      }}
    >
      <h1 className="text-3xl font-black tracking-tight">{T.join.title}</h1>
      <label className="flex flex-col gap-2 text-sm font-medium">
        {T.join.nicknameLabel}
        <input
          value={nickname}
          onChange={(e) => onNickname(e.target.value.slice(0, 24))}
          placeholder={T.join.nicknamePlaceholder}
          className="min-h-14 rounded-2xl border-2 border-line bg-surface px-5 text-lg outline-none focus:border-accent"
        />
      </label>
      <button type="submit" className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-accent-fg">
        {T.join.enter}
      </button>
    </form>
  );
}

function Question({ id, text }: { id: string; text: string }) {
  return (
    <h1 id={id} className="text-2xl font-extrabold leading-snug tracking-tight">
      {text}
    </h1>
  );
}

function WaitingCard() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
      <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
        <Logo size={72} animated />
      </motion.div>
      <h1 className="text-2xl font-bold">{T.waiting.title}</h1>
      <p className="max-w-xs text-muted">{T.waiting.body}</p>
    </div>
  );
}

/** Oturum bitince (ya da oda kapalıyken) geri sayım yapılır ve kullanıcı ana sayfaya yönlendirilir. */
const END_REDIRECT_SECONDS = 5;

function RedirectCard({ title, body }: { title: string; body: string }) {
  const [seconds, setSeconds] = useState(END_REDIRECT_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.replace(HOME_URL);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return <Card title={title} body={`${body} ${T.ended.redirectMessage}… ${Math.max(seconds, 0)}`} />;
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="rounded-3xl border border-line bg-surface p-6 text-center shadow-card">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted">{body}</p>
    </div>
  );
}

