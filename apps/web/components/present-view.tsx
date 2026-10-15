'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_URL } from '@/lib/config';
import { T } from '@/lib/strings';
import { getHostKey } from '@/lib/room-storage';
import { useRoom, type ConnState } from '@/lib/use-room';
import { Logo } from './logo';
import { QrCode } from './qr-code';
import { ResultsChart } from './results';

/** Sunum ekranı: tam ekran, yüksek kontrast, uzaktan okunabilir. Host kontrolleri alt barda. */
export function PresentView({ code }: { code: string }) {
  const hostKey = getHostKey(code);
  const { state, actions } = useRoom({ code, role: 'host', hostKey: hostKey ?? undefined, enabled: Boolean(hostKey) });
  const joinUrl = `${APP_URL}/j/${code}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') void actions.setSlide(Math.min(state.slideIndex + 1, state.slideCount - 1));
      if (e.key === 'ArrowLeft') void actions.setSlide(Math.max(state.slideIndex - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, state.slideIndex, state.slideCount]);

  if (!hostKey) {
    return (
      <Screen>
        <Message title={T.errors.forbidden} body={T.present.noKey} />
      </Screen>
    );
  }

  if (state.ended) {
    return (
      <Screen>
        <Message title={T.ended.title} body={T.ended.body} />
      </Screen>
    );
  }

  if (state.errorCode) {
    return (
      <Screen>
        <Message title={T.errors.generic} body={state.errorCode === 'forbidden' ? T.errors.forbiddenBody : T.errors.notFoundBody} />
      </Screen>
    );
  }

  const slide = state.slide;
  const conn: ConnState = state.status === null ? 'connecting' : state.conn;
  const hasResults = slide !== null && state.results?.slideId === slide.id;

  return (
    <Screen>
      {/* Üst bilgi: oda kodu, katılımcı sayısı, bağlantı */}
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <p className="text-sm uppercase tracking-widest text-muted">{T.present.roomCode}</p>
            <p className="text-3xl font-black tabular-nums tracking-wider">{code}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-lg">
          <span className="rounded-full bg-accent-soft px-4 py-2 font-bold tabular-nums text-accent" aria-live="polite">
            {state.participantCount} {T.present.participants}
          </span>
          <span className="text-muted">{conn === 'connected' ? T.conn.connected : T.conn.reconnecting}</span>
        </div>
      </header>

      {/* Ana alan: soru ve canlı sonuç */}
      <main className="flex flex-1 flex-col items-center justify-center gap-10 py-8">
        <AnimatePresence mode="wait" initial={false}>
          {slide ? (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full max-w-5xl flex-col gap-10"
            >
              <h1 className="text-center text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
                {slide.question}
              </h1>
              {!slide.settings.votingOpen && slide.type !== 'qa' && (
                <p className="text-center text-2xl text-muted">{T.vote.closed}</p>
              )}
              {hasResults && state.results && (
                <ResultsChart slide={slide} results={state.results.data} large />
              )}
              {!hasResults && slide.type !== 'qa' && slide.settings.votingOpen && (
                <p className="text-center text-2xl text-muted">{T.results.empty}</p>
              )}
              {slide.type === 'qa' && hasResults && state.results && (
                <ResultsChart slide={slide} results={state.results.data} large />
              )}
            </motion.div>
          ) : (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 text-center">
              <Logo size={120} animated />
              <p className="text-4xl font-bold">{T.waiting.title}</p>
              <p className="text-xl text-muted">{T.present.joinHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Köşede QR: katılımcılar telefonla tarar */}
      <div className="pointer-events-none fixed bottom-24 right-6 hidden flex-col items-center gap-2 md:flex">
        <QrCode value={joinUrl} size={150} label={`${T.present.roomCode} ${code}`} />
        <p className="text-sm font-semibold text-muted">{code}</p>
      </div>

      <Controls
        state={state}
        onPrev={() => actions.setSlide(Math.max(state.slideIndex - 1, 0))}
        onNext={() => actions.setSlide(Math.min(state.slideIndex + 1, state.slideCount - 1))}
        onStart={() => actions.setSlide(0)}
        onToggleVoting={() => actions.toggleVoting(!(slide?.settings.votingOpen ?? false))}
        onToggleResults={() => actions.toggleResults(!(slide?.settings.showResults ?? false))}
        onEnd={async () => {
          if (window.confirm(T.present.endConfirm)) await actions.endRoom();
        }}
      />
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-28 pt-6 md:px-12">{children}</div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-5xl font-extrabold">{title}</h1>
      <p className="max-w-xl text-xl text-muted">{body}</p>
    </div>
  );
}

function Controls({
  state,
  onPrev,
  onNext,
  onStart,
  onToggleVoting,
  onToggleResults,
  onEnd,
}: {
  state: ReturnType<typeof useRoom>['state'];
  onPrev: () => void;
  onNext: () => void;
  onStart: () => void;
  onToggleVoting: () => void;
  onToggleResults: () => void;
  onEnd: () => void;
}) {
  const slide = state.slide;
  const btn =
    'min-h-12 rounded-xl border border-line bg-surface px-4 text-base font-semibold shadow-card transition hover:border-accent disabled:opacity-40';
  return (
    <nav
      aria-label="Sunum kontrolleri"
      className="fixed inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-3 border-t border-line bg-bg/90 px-4 py-4 backdrop-blur"
    >
      {state.slideCount === 0 || state.slideIndex < 0 ? (
        <button type="button" onClick={onStart} disabled={state.slideCount === 0} className={`${btn} bg-accent text-accent-fg`}>
          {T.present.next}
        </button>
      ) : (
        <>
          <button type="button" onClick={onPrev} disabled={state.slideIndex <= 0} className={btn} aria-label={T.present.previous}>
            ← {T.present.previous}
          </button>
          <span className="min-w-24 text-center font-bold tabular-nums" aria-live="polite">
            {state.slideIndex + 1} / {state.slideCount}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={state.slideIndex >= state.slideCount - 1}
            className={btn}
            aria-label={T.present.next}
          >
            {T.present.next} →
          </button>
        </>
      )}
      {slide && slide.type !== 'qa' && (
        <button type="button" onClick={onToggleVoting} className={btn} aria-pressed={slide.settings.votingOpen}>
          {slide.settings.votingOpen ? T.present.votingOn : T.present.votingOff}
        </button>
      )}
      {slide && slide.type !== 'qa' && (
        <button type="button" onClick={onToggleResults} className={btn} aria-pressed={slide.settings.showResults}>
          {slide.settings.showResults ? T.present.resultsHide : T.present.resultsShow}
        </button>
      )}
      <button type="button" onClick={onEnd} className={`${btn} text-red-500`}>
        {T.present.endRoom}
      </button>
    </nav>
  );
}

