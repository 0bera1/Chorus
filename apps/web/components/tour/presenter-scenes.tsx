import type { ReactNode } from 'react';
import type { PublicSlide, QaQuestion, SlideResults } from '@chorus/shared';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Logo } from '../logo';
import { QrCode } from '../qr-code';
import { ResultsChart } from '../results';
import type { Scene } from './tour-stage';

const CODE = 'ABC123';
const PARTICIPANTS = 14;
/** Çoktan seçmeli oylardaki hedef dağılım (seçenek sırasına göre) */
const CHOICE_TARGET = [7, 5, 4, 2];
const CLOUD_WEIGHTS = [5, 4, 3, 3, 2, 1];
const SCALE_TARGET: Record<string, number> = { '1': 1, '2': 2, '3': 4, '4': 7, '5': 5 };
const QA_ITEMS = [
  { upvotes: 5, from: 0 },
  { upvotes: 3, from: 1500 },
  { upvotes: 1, from: 3000 },
];

/** 0 → 1 arası, `start` ile `end` ms arasında doğrusal ilerleme. */
const ramp = (elapsed: number, start: number, end: number) => Math.min(1, Math.max(0, (elapsed - start) / (end - start)));
const within = (elapsed: number, from: number, to: number) => elapsed >= from && elapsed < to;

function choiceSlide(t: Dictionary, votingOpen: boolean, showResults: boolean): PublicSlide {
  return {
    id: 'tour-choice',
    position: 0,
    type: 'multiple_choice',
    question: t.demo.slides.choiceQuestion,
    options: t.demo.slides.choiceOptions.map((text, i) => ({ id: `o${i}`, text })),
    settings: { allowVoteChange: true, showResults, votingOpen, hideOpenText: false },
  };
}

function choiceResults(elapsed: number, duration: number): SlideResults {
  const p = ramp(elapsed, 0, duration);
  const counts = Object.fromEntries(CHOICE_TARGET.map((v, i) => [`o${i}`, Math.round(v * p)]));
  return { type: 'multiple_choice', total: Object.values(counts).reduce((a, b) => a + b, 0), counts };
}

interface Control {
  label: string;
  pressed?: boolean;
}

/** Sunum ekranının iskeleti: üst bilgi, içerik ve alttaki host kontrolleri. */
function PresenterScreen({
  t,
  participants,
  controls,
  children,
}: {
  t: Dictionary;
  participants: number;
  controls: Control[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[340px] flex-col gap-5 rounded-2xl border border-line bg-surface p-4 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted">{t.present.roomCode}</p>
            <p className="text-xl font-black tracking-wider tabular-nums">{CODE}</p>
          </div>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold tabular-nums text-accent">
          {t.present.participants(participants)}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-5">{children}</div>

      <div className="flex flex-wrap justify-center gap-2 border-t border-line pt-4">
        {controls.map((control) => (
          <span
            key={control.label}
            className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold transition duration-200 ${
              control.pressed ? 'ring-4 ring-highlight/60 border-accent bg-accent text-accent-fg' : 'border-line bg-bg'
            }`}
          >
            {control.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Question({ text }: { text: string }) {
  return <h3 className="text-center text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{text}</h3>;
}

export function buildPresenterScenes(t: Dictionary): Scene[] {
  const s = t.tour.presenterScenes;
  const words = t.tour.words;
  const qs = t.tour.questions;

  return [
    {
      duration: 5000,
      caption: s.lobby,
      render: (e) => (
        <PresenterScreen t={t} participants={Math.round(PARTICIPANTS * ramp(e, 0, 4000))} controls={[]}>
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-3 text-center">
              <Logo size={88} animated />
              <p className="text-3xl font-extrabold">{t.waiting.title}</p>
              <p className="text-muted">{t.present.joinHint}</p>
            </div>
            <QrCode value={`/j/${CODE}`} size={150} label={`${t.present.roomCode} ${CODE}`} />
          </div>
        </PresenterScreen>
      ),
    },
    {
      duration: 4500,
      caption: s.open,
      render: (e) => {
        const open = e >= 2500;
        return (
          <PresenterScreen
            t={t}
            participants={PARTICIPANTS}
            controls={[{ label: open ? t.present.votingOn : t.present.votingOff, pressed: within(e, 1500, 2500) }]}
          >
            <Question text={t.demo.slides.choiceQuestion} />
            <p className="text-center text-lg text-muted">{open ? t.results.empty : t.vote.closed}</p>
          </PresenterScreen>
        );
      },
    },
    {
      duration: 8000,
      caption: s.live,
      render: (e) => {
        const results = choiceResults(e, 7000);
        return (
          <PresenterScreen t={t} participants={PARTICIPANTS} controls={[{ label: t.present.votingOn }]}>
            <Question text={t.demo.slides.choiceQuestion} />
            {results.type === 'multiple_choice' && <ResultsChart slide={choiceSlide(t, true, false)} results={results} />}
          </PresenterScreen>
        );
      },
    },
    {
      duration: 4000,
      caption: s.results,
      render: (e) => {
        const results = choiceResults(7000, 7000);
        return (
          <PresenterScreen
            t={t}
            participants={PARTICIPANTS}
            controls={[
              { label: e >= 1500 ? t.present.resultsHide : t.present.resultsShow, pressed: within(e, 500, 1500) },
              { label: t.present.votingOn },
            ]}
          >
            <Question text={t.demo.slides.choiceQuestion} />
            {results.type === 'multiple_choice' && <ResultsChart slide={choiceSlide(t, true, e >= 1500)} results={results} />}
          </PresenterScreen>
        );
      },
    },
    {
      duration: 7000,
      caption: s.wordCloud,
      render: (e) => {
        const cloudSlide: PublicSlide = {
          id: 'tour-cloud',
          position: 1,
          type: 'word_cloud',
          question: t.demo.slides.cloudQuestion,
          options: [],
          settings: { allowVoteChange: false, showResults: true, votingOpen: true, hideOpenText: false },
        };
        const results: SlideResults = {
          type: 'word_cloud',
          total: 0,
          words: words
            .map((word, i) => ({ word, count: Math.round(CLOUD_WEIGHTS[i]! * ramp(e, 0, 6000)) }))
            .filter((w) => w.count > 0),
        };
        return (
          <PresenterScreen t={t} participants={PARTICIPANTS} controls={[{ label: t.present.votingOn }, { label: t.present.next, pressed: e >= 6000 }]}>
            <Question text={cloudSlide.question} />
            <ResultsChart slide={cloudSlide} results={results} />
          </PresenterScreen>
        );
      },
    },
    {
      duration: 5500,
      caption: s.scale,
      render: (e) => {
        const p = ramp(e, 0, 4500);
        const distribution = Object.fromEntries(Object.entries(SCALE_TARGET).map(([k, v]) => [k, Math.round(v * p)]));
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        const sum = Object.entries(distribution).reduce((acc, [k, v]) => acc + Number(k) * v, 0);
        const scaleSlide: PublicSlide = {
          id: 'tour-scale',
          position: 2,
          type: 'scale',
          question: t.demo.slides.scaleQuestion,
          options: [],
          settings: { allowVoteChange: false, showResults: true, votingOpen: true, hideOpenText: false },
        };
        return (
          <PresenterScreen t={t} participants={PARTICIPANTS} controls={[{ label: t.present.votingOn }, { label: t.present.next, pressed: e >= 5000 }]}>
            <Question text={scaleSlide.question} />
            <ResultsChart slide={scaleSlide} results={{ type: 'scale', total, average: total ? sum / total : 0, distribution }} />
          </PresenterScreen>
        );
      },
    },
    {
      duration: 6500,
      caption: s.qa,
      render: (e) => {
        const questions: QaQuestion[] = QA_ITEMS.map((item, i) => ({
          id: `q${i}`,
          text: qs[i]!,
          upvotes: item.upvotes,
          hidden: false,
          mine: false,
        }))
          .filter((_, i) => e >= QA_ITEMS[i]!.from)
          .sort((a, b) => b.upvotes - a.upvotes);
        const qaSlide: PublicSlide = {
          id: 'tour-qa',
          position: 4,
          type: 'qa',
          question: t.demo.slides.qaQuestion,
          options: [],
          settings: { allowVoteChange: false, showResults: true, votingOpen: false, hideOpenText: false },
        };
        return (
          <PresenterScreen t={t} participants={PARTICIPANTS} controls={[{ label: t.present.next, pressed: e >= 6000 }]}>
            <Question text={qaSlide.question} />
            <ResultsChart slide={qaSlide} results={{ type: 'qa', total: questions.length, questions }} />
          </PresenterScreen>
        );
      },
    },
    {
      duration: 4500,
      caption: s.end,
      render: (e) => (
        <PresenterScreen t={t} participants={PARTICIPANTS} controls={[{ label: t.present.endRoom, pressed: within(e, 1000, 2500) }]}>
          {e < 2500 ? (
            <p className="text-center text-xl text-muted">{t.present.endConfirm}</p>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-4xl font-extrabold">{t.ended.title}</p>
              <p className="text-muted">{t.ended.body}</p>
            </div>
          )}
        </PresenterScreen>
      ),
    },
  ];
}
