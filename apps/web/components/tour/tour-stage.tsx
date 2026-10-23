'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '@/lib/i18n/locale-context';
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, PauseIcon, PlayIcon } from '../icons';
import { BrandBackdrop } from '../brand-backdrop';

export type TourRole = 'presenter' | 'participant';

/** Bir sahne: süresi dolunca sonrakine geçilir. `render` geçen süreye (ms) göre çizer, böylece duraklatma kendiliğinden çalışır. */
export interface Scene {
  duration: number;
  caption: string;
  render: (elapsed: number) => ReactNode;
}

const TICK = 100;

interface Props {
  role: TourRole;
  scenes: Scene[];
  onClose: () => void;
  onBack: () => void;
}

/** Öğret sahnesi: seçilen role göre canlandırılmış bir sunumu adım adım oynatır. */
export function TourStage({ role, scenes, onClose, onBack }: Props) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);

  const last = scenes.length - 1;
  const scene = scenes[index]!;
  const roleTitle = role === 'presenter' ? t.tour.presenterRole.title : t.tour.participantRole.title;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed((e) => e + TICK), TICK);
    return () => clearInterval(id);
  }, [playing]);

  // Sahne süresi dolunca sonrakine geç; son sahnede oynatma durur
  useEffect(() => {
    if (!playing || elapsed < scene.duration) return;
    if (index < last) {
      setIndex((i) => i + 1);
      setElapsed(0);
    } else {
      setPlaying(false);
    }
  }, [playing, elapsed, index, last, scene.duration]);

  const goTo = (target: number) => {
    setIndex(Math.max(0, Math.min(last, target)));
    setElapsed(0);
  };

  const next = () => (index === last ? onClose() : goTo(index + 1));

  const togglePlay = () => {
    if (!playing && elapsed >= scene.duration && index === last) goTo(0);
    setPlaying((p) => !p);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        if (index === last) onClose();
        else goTo(index + 1);
      }
      if (e.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, last, onClose]);

  const fill = (i: number) => (i < index ? 1 : i === index ? Math.min(1, elapsed / scene.duration) : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-6"
      style={{ background: 'var(--overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-label={roleTitle}
    >
      <div className="flex w-full max-w-4xl flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-card md:p-7">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-muted hover:text-fg"
          >
            <ArrowLeftIcon size={16} />
            <span className="hidden sm:inline">{t.tour.back}</span>
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden items-center gap-2 text-xs sm:flex font-bold uppercase tracking-widest text-muted">
              <span
                className={`h-2 w-2 rounded-full ${playing ? 'animate-pulse bg-highlight' : 'bg-line'}`}
                aria-hidden
              />
              {playing ? t.conn.connected : t.tour.pause}
            </span>
            <p className="min-w-0 truncate font-extrabold tracking-tight">{roleTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.tour.close}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {scenes.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft">
              <div
                className={`h-full origin-left rounded-full ${i === index ? 'bg-highlight' : 'bg-accent'}`}
                style={{ transform: `scaleX(${fill(i)})` }}
              />
            </div>
          ))}
        </div>

        <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg p-3 md:p-6">
          <BrandBackdrop />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full items-center justify-center"
            >
              {role === 'presenter' ? (
                <div className="w-full max-w-3xl">{scene.render(elapsed)}</div>
              ) : (
                <div className="relative w-full max-w-[300px] rounded-[2.6rem] border border-line bg-fg/[0.04] p-2 shadow-card">
                  <div className="absolute left-1/2 top-3.5 h-1.5 w-16 -translate-x-1/2 rounded-full bg-line" aria-hidden />
                  <div className="overflow-hidden rounded-[2.1rem] bg-surface pt-6">{scene.render(elapsed)}</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p key={index} className="min-h-[3.5rem] text-center text-lg font-semibold leading-snug">
          {scene.caption}
        </p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 font-semibold transition hover:border-accent disabled:opacity-40"
          >
            <ArrowLeftIcon size={16} />
            {t.tour.prev}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={playing}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-muted hover:text-fg"
          >
            {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            {playing ? t.tour.pause : t.tour.play}
          </button>
          <button
            type="button"
            onClick={next}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-accent-fg shadow-card"
          >
            {index === last ? t.tour.finish : t.tour.next}
            {index !== last && <ArrowRightIcon size={16} />}
          </button>
        </div>
        <p className="text-center text-sm tabular-nums text-muted">{t.tour.stepOf(index + 1, scenes.length)}</p>
      </div>
    </div>
  );
}
