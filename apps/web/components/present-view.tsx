'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_URL } from '@/lib/config';
import { useT } from '@/lib/i18n/locale-context';
import { getHostKey } from '@/lib/room-storage';
import { useRoom, type ConnState } from '@/lib/use-room';
import { Logo } from './logo';
import { QrCode } from './qr-code';
import { ResultsChart } from './results';

/** Sunum ekranı: tam ekran, yüksek kontrast, uzaktan okunabilir. Host kontrolleri alt barda. */
export function PresentView({ code }: { code: string }) {
  const t = useT();
  const hostKey = getHostKey(code);
  const { state, actions } = useRoom({ code, role: 'host', hostKey: hostKey ?? undefined, enabled: Boolean(hostKey) });
  const joinUrl = `${APP_URL}/j/${code}`;

  // Lobi açılır açılmaz ilk slayt gösterilir; sunum sahibi beklemek zorunda kalmaz
  const openedFirstSlide = useRef(false);
  useEffect(() => {
    if (openedFirstSlide.current) return;
    if (state.conn !== 'connected' || state.status !== 'lobby' || state.slideCount === 0) return;
    openedFirstSlide.current = true;
    void actions.setSlide(0);
  }, [actions, state.conn, state.status, state.slideCount]);

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
        <Message title={t.errors.forbidden} body={t.present.noKey} />
      </Screen>
    );
  }

  if (state.ended) {
    return (
      <Screen>
        <Message title={t.ended.title} body={t.ended.body} />
      </Screen>
    );
  }

  if (state.errorCode) {
    return (
      <Screen>
        <Message title={t.errors.generic} body={state.errorCode === 'forbidden' ? t.errors.forbiddenBody : t.errors.notFoundBody} />
      </Screen>
    );
  }

  const slide = state.slide;
  const conn: ConnState = state.status === null ? 'connecting' : state.conn;
  const hasResults = slide !== null && state.results?.slideId === slide.id;

  return (
    <Screen>
      {/* Üst bilgi: oda kodu, katılımcı sayısı, bağlantı */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <p className="text-sm uppercase tracking-widest text-muted">{t.present.roomCode}</p>
            <p className="text-2xl font-black tabular-nums tracking-wider sm:text-3xl">{code}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-base sm:gap-4 sm:text-lg">
          <span className="whitespace-nowrap rounded-full bg-accent-soft px-4 py-2 font-bold tabular-nums text-accent" aria-live="polite">
            {t.present.participants(state.participantCount)}
          </span>
          <span className="text-muted">{conn === 'connected' ? t.conn.connected : t.conn.reconnecting}</span>
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
              <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                {slide.question}
              </h1>
              {!slide.settings.votingOpen && slide.type !== 'qa' && (
                <p className="text-center text-2xl text-muted">{t.vote.closed}</p>
              )}
              {hasResults && state.results && (
                <ResultsChart slide={slide} results={state.results.data} large />
              )}
              {!hasResults && slide.type !== 'qa' && slide.settings.votingOpen && (
                <p className="text-center text-2xl text-muted">{t.results.empty}</p>
              )}
            </motion.div>
          ) : (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 text-center">
              <Logo size={120} animated />
              <p className="text-4xl font-bold">{t.waiting.title}</p>
              <p className="text-xl text-muted">{t.present.joinHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Köşede QR: katılımcılar telefonla tarar */}
      <div className="pointer-events-none fixed bottom-24 right-6 hidden flex-col items-center gap-2 md:flex">
        <QrCode value={joinUrl} size={150} label={`${t.present.roomCode} ${code}`} />
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
          if (window.confirm(t.present.endConfirm)) await actions.endRoom();
        }}
      />
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-4 pb-44 pt-5 sm:px-6 md:px-12 md:pb-28 md:pt-6">{children}</div>
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
  const t = useT();
  const slide = state.slide;
  const btn =
    'min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-semibold shadow-card transition hover:border-accent disabled:opacity-40 sm:min-h-12 sm:px-4 sm:text-base';
  return (
    <nav
      aria-label={t.a11y.controls}
      className="fixed inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 border-t border-line bg-bg/90 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4 sm:py-4"
    >
      {state.slideCount === 0 || state.slideIndex < 0 ? (
        <button type="button" onClick={onStart} disabled={state.slideCount === 0} className={`${btn} bg-accent text-accent-fg`}>
          {t.present.next}
        </button>
      ) : (
        <>
          <button type="button" onClick={onPrev} disabled={state.slideIndex <= 0} className={btn} aria-label={t.present.previous}>
            ← {t.present.previous}
          </button>
          <span className="min-w-24 text-center font-bold tabular-nums" aria-live="polite">
            {state.slideIndex + 1} / {state.slideCount}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={state.slideIndex >= state.slideCount - 1}
            className={btn}
            aria-label={t.present.next}
          >
            {t.present.next} →
          </button>
        </>
      )}
      {slide && slide.type !== 'qa' && (
        <button type="button" onClick={onToggleVoting} className={btn} aria-pressed={slide.settings.votingOpen}>
          {slide.settings.votingOpen ? t.present.votingOn : t.present.votingOff}
        </button>
      )}
      {slide && slide.type !== 'qa' && (
        <button type="button" onClick={onToggleResults} className={btn} aria-pressed={slide.settings.showResults}>
          {slide.settings.showResults ? t.present.resultsHide : t.present.resultsShow}
        </button>
      )}
      <button type="button" onClick={onEnd} className={`${btn} text-red-500`}>
        {t.present.endRoom}
      </button>
    </nav>
  );
}
