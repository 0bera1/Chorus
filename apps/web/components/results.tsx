'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { PublicSlide, SlideResults } from '@chorus/shared';
import { useT } from '@/lib/i18n/locale-context';

const LETTERS = 'ABCDEFGH';

interface Props {
  slide: PublicSlide;
  results: SlideResults;
  /** Sunum ekranında büyük yazı, telefonda kompakt */
  large?: boolean;
}

/** Slayt tipine göre canlı sonuç grafiği. Renge ek olarak harf/etiket de kullanılır (renk körlüğü). */
export function ResultsChart({ slide, results, large = false }: Props) {
  if (results.type === 'multiple_choice' && slide.type === 'multiple_choice') {
    return <ChoiceBars slide={slide} total={results.total} counts={results.counts} large={large} />;
  }
  if (results.type === 'scale') {
    return <ScaleChart average={results.average} total={results.total} distribution={results.distribution} large={large} />;
  }
  if (results.type === 'word_cloud') {
    return <WordCloud words={results.words} large={large} />;
  }
  if (results.type === 'open_text') {
    return <OpenTextList texts={results.texts} large={large} />;
  }
  if (results.type === 'qa') {
    return <QaList questions={results.questions} large={large} />;
  }
  return null;
}

function ChoiceBars({
  slide,
  total,
  counts,
  large,
}: {
  slide: PublicSlide;
  total: number;
  counts: Record<string, number>;
  large: boolean;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  return (
    <ul className={large ? 'space-y-4 md:space-y-5' : 'space-y-3'} aria-label={t.a11y.results}>
      {slide.options.map((option, i) => {
        const count = counts[option.id] ?? 0;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <li key={option.id}>
            <div className={`mb-1 flex items-baseline justify-between gap-3 ${large ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base'} font-semibold`}>
              <span className="flex items-baseline gap-3">
                <span className="rounded-md bg-accent-soft px-2 text-accent">{LETTERS[i]}</span>
                <span>{option.text}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap tabular-nums text-muted">
                {pct}% · {count}
              </span>
            </div>
            <div className={`${large ? 'h-6 md:h-8' : 'h-4'} w-full overflow-hidden rounded-full bg-accent-soft`}>
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </li>
        );
      })}
      <li className="pt-2 text-sm text-muted">{t.results.responses(total)}</li>
    </ul>
  );
}

function ScaleChart({
  average,
  total,
  distribution,
  large,
}: {
  average: number;
  total: number;
  distribution: Record<string, number>;
  large: boolean;
}) {
  const t = useT();
  const max = Math.max(1, ...Object.values(distribution));
  const keys = ['1', '2', '3', '4', '5'];
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className={`${large ? 'text-[5.5rem] leading-none md:text-[9rem]' : 'text-6xl'} font-black tabular-nums text-accent`}>
          {total === 0 ? '–' : average.toFixed(1)}
        </div>
        <div className={`${large ? 'text-lg md:text-2xl' : 'text-sm'} text-muted`}>
          {t.results.average} · {t.results.responses(total)}
        </div>
      </div>
      <div className={`flex w-full items-end justify-center gap-3 sm:gap-4 ${large ? 'h-48 md:h-64' : 'h-32'}`}>
        {keys.map((k) => {
          const count = distribution[k] ?? 0;
          const h = Math.round((count / max) * 100);
          return (
            <div key={k} className="flex h-full w-10 flex-col items-center justify-end gap-2 sm:w-14">
              <span className="text-sm tabular-nums text-muted">{count}</span>
              <motion.div
                className="w-full rounded-t-xl bg-accent"
                initial={false}
                animate={{ height: `${Math.max(h, 2)}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
              />
              <span className="font-semibold">{k}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Kelime bulutu: boyut, sayıya göre font-size ile verilir (transform değil), böylece
 * flex akışı kelimelerin gerçek kutularını hesaplar ve kelimeler üst üste binmez.
 */
function WordCloud({ words, large }: { words: { word: string; count: number }[]; large: boolean }) {
  const t = useT();
  if (words.length === 0) return <p className="text-muted">{t.results.empty}</p>;
  const counts = words.map((w) => w.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const [minRem, maxRem] = large ? [1.25, 4] : [0.95, 1.9];
  return (
    <div className="flex flex-col items-center gap-1 text-center leading-tight">
      <AnimatePresence>
        {words.map((w) => {
          const ratio = max === min ? 1 : (w.count - min) / (max - min);
          const size = minRem + ratio * (maxRem - minRem);
          return (
            <motion.span
              key={w.word}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-accent"
              style={{ fontSize: `${size.toFixed(2)}rem` }}
            >
              {w.word}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function OpenTextList({ texts, large }: { texts: { id: string; text: string }[]; large: boolean }) {
  const t = useT();
  if (texts.length === 0) return <p className="text-muted">{t.results.empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {texts.slice(-30).reverse().map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border border-line bg-surface px-5 py-3 shadow-card ${large ? 'text-lg md:text-2xl' : 'text-base'}`}
          >
            {item.text}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function QaList({
  questions,
  large,
}: {
  questions: { id: string; text: string; upvotes: number; mine: boolean }[];
  large: boolean;
}) {
  const t = useT();
  if (questions.length === 0) return <p className="text-muted">{t.qa.empty}</p>;
  return (
    <ol className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {questions.map((q, i) => (
          <motion.li
            key={q.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-3 shadow-card ${large ? 'text-lg md:text-2xl' : 'text-base'}`}
          >
            <span className="w-8 shrink-0 text-center font-bold text-muted">{i + 1}</span>
            <span className="flex-1">{q.text}</span>
            <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 font-semibold tabular-nums text-accent">
              ▲ {q.upvotes}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
