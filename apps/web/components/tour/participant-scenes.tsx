import type { ReactNode } from 'react';
import type { PublicSlide, SlideResults } from '@chorus/shared';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Logo } from '../logo';
import { ResultsChart } from '../results';
import type { Scene } from './tour-stage';

const CODE = 'ABC123';
const LETTERS = 'ABCD';
const CHOICE_FINAL = [7, 5, 4, 2];

const ramp = (elapsed: number, start: number, end: number) => Math.min(1, Math.max(0, (elapsed - start) / (end - start)));
const within = (elapsed: number, from: number, to: number) => elapsed >= from && elapsed < to;
/** Yazılan metni, ilerlemeye göre harf harf gösterir. */
const typed = (text: string, elapsed: number, start: number, end: number) => text.slice(0, Math.round(text.length * ramp(elapsed, start, end)));

/** Telefon ekranının iskeleti: üst bilgi ve içerik. */
function PhoneScreen({ t, children }: { t: Dictionary; children: ReactNode }) {
  return (
    <div className="flex min-h-[420px] flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-sm font-bold">{t.brand}</span>
          <span className="text-xs tabular-nums text-muted">{CODE}</span>
        </div>
        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium">{t.conn.connected}</span>
      </header>
      <div className="flex flex-1 flex-col justify-center gap-4">{children}</div>
    </div>
  );
}

function Question({ text }: { text: string }) {
  return <h3 className="text-lg font-extrabold leading-snug tracking-tight">{text}</h3>;
}

function Card({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg p-4 text-center">
      <p className="font-bold">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
  );
}

function Field({ label, value, focused }: { label: string; value: string; focused?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className={`min-h-11 rounded-xl border-2 bg-bg px-3 py-2 text-sm ${focused ? 'border-accent' : 'border-line'}`}>
        {value}
        {focused && <span className="animate-pulse text-accent">|</span>}
      </div>
    </div>
  );
}

function Button({ label, pressed, disabled }: { label: string; pressed?: boolean; disabled?: boolean }) {
  return (
    <span
      className={`flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-fg transition duration-200 ${
        pressed ? 'ring-4 ring-highlight/60' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {label}
    </span>
  );
}

export function buildParticipantScenes(t: Dictionary): Scene[] {
  const s = t.tour.participantScenes;
  const options = t.demo.slides.choiceOptions;
  const question = t.demo.slides.choiceQuestion;

  const choiceSlide: PublicSlide = {
    id: 'tour-choice',
    position: 0,
    type: 'multiple_choice',
    question,
    options: options.map((text, i) => ({ id: `o${i}`, text })),
    settings: { allowVoteChange: true, showResults: true, votingOpen: true, hideOpenText: false },
  };
  const choiceResults: SlideResults = {
    type: 'multiple_choice',
    total: CHOICE_FINAL.reduce((a, b) => a + b, 0),
    counts: Object.fromEntries(CHOICE_FINAL.map((v, i) => [`o${i}`, v])),
  };

  const thanks = (
    <div className="rounded-2xl bg-accent-soft px-4 py-3 text-center">
      <p className="text-sm font-bold text-accent">{t.vote.thanks}</p>
      <p className="mt-1 text-xs text-muted">{t.vote.changeAllowed}</p>
    </div>
  );

  return [
    {
      duration: 5000,
      caption: s.join,
      render: (e) => {
        if (e >= 3600) {
          return (
            <PhoneScreen t={t}>
              <div className="flex flex-col items-center gap-3 text-center">
                <Logo size={64} animated />
                <p className="text-lg font-bold">{t.waiting.title}</p>
                <p className="text-sm text-muted">{t.waiting.body}</p>
              </div>
            </PhoneScreen>
          );
        }
        return (
          <PhoneScreen t={t}>
            <h2 className="text-2xl font-black tracking-tight">{t.join.title}</h2>
            <Field label={t.join.nicknameLabel} value={typed(t.tour.nickname, e, 600, 2600)} focused />
            <span className={`flex min-h-11 items-center justify-center rounded-xl bg-accent font-bold text-accent-fg transition-transform ${within(e, 3000, 3600) ? 'ring-4 ring-highlight/60' : ''}`}>
              {t.join.enter}
            </span>
          </PhoneScreen>
        );
      },
    },
    {
      duration: 3500,
      caption: s.closed,
      render: () => (
        <PhoneScreen t={t}>
          <Question text={question} />
          <Card title={t.vote.closed} body={t.vote.closedBody} />
        </PhoneScreen>
      ),
    },
    {
      duration: 6000,
      caption: s.vote,
      render: (e) => {
        const selected = e >= 2000 ? 1 : -1;
        return (
          <PhoneScreen t={t}>
            <Question text={question} />
            <ul className="flex flex-col gap-2">
              {options.map((text, i) => {
                const isSelected = i === selected;
                const tapping = within(e, 1700, 2000) && i === 1;
                return (
                  <li
                    key={text}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition duration-200 ${
                      isSelected ? 'border-accent bg-accent-soft' : 'border-line bg-bg'
                    } ${tapping ? 'ring-4 ring-highlight/60' : ''}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
                      {LETTERS[i]}
                    </span>
                    <span className="flex-1">{text}</span>
                    {isSelected && <span className="text-accent">✓</span>}
                  </li>
                );
              })}
            </ul>
            {e >= 2000 && thanks}
          </PhoneScreen>
        );
      },
    },
    {
      duration: 4500,
      caption: s.results,
      render: () => (
        <PhoneScreen t={t}>
          <Question text={question} />
          <ResultsChart slide={choiceSlide} results={choiceResults} />
        </PhoneScreen>
      ),
    },
    {
      duration: 6000,
      caption: s.wordCloud,
      render: (e) => (
        <PhoneScreen t={t}>
          <Question text={t.demo.slides.cloudQuestion} />
          <Field label={t.vote.wordPlaceholder} value={typed(t.tour.myWord, e, 500, 2500)} focused={e < 2600} />
          <Button label={t.vote.submit} pressed={within(e, 2800, 3300)} disabled={e < 2500} />
          {e >= 3600 && thanks}
        </PhoneScreen>
      ),
    },
    {
      duration: 4000,
      caption: s.scale,
      render: (e) => {
        const chosen = e >= 1600 ? 4 : null;
        return (
          <PhoneScreen t={t}>
            <Question text={t.demo.slides.scaleQuestion} />
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`flex aspect-square items-center justify-center rounded-xl border-2 text-lg font-black transition duration-200 ${
                    chosen === value ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-bg'
                  } ${within(e, 1200, 1600) && value === 4 ? 'ring-4 ring-highlight/60' : ''}`}
                >
                  {value}
                </span>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{t.vote.scaleLow}</span>
              <span>{t.vote.scaleHigh}</span>
            </div>
            {chosen !== null && thanks}
          </PhoneScreen>
        );
      },
    },
    {
      duration: 7000,
      caption: s.qa,
      render: (e) => {
        const items = [
          { text: t.tour.questions[0]!, upvotes: e >= 4500 ? 6 : 5, mine: false },
          { text: t.tour.questions[1]!, upvotes: 3, mine: false },
          ...(e >= 3000 ? [{ text: t.tour.myQuestion, upvotes: 0, mine: true }] : []),
        ];
        return (
          <PhoneScreen t={t}>
            <Question text={t.demo.slides.qaQuestion} />
            <Field label={t.qa.askPlaceholder} value={typed(t.tour.myQuestion, e, 500, 2500)} focused={e < 2600} />
            <Button label={t.qa.ask} pressed={within(e, 2600, 3000)} disabled={e < 2500} />
            <ol className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.text} className="flex items-center gap-2 rounded-xl border border-line bg-bg p-3 text-sm">
                  <span className="flex-1">{item.text}</span>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums transition duration-200 ${
                      item.upvotes === 6 && e >= 4500 ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent'
                    } ${within(e, 4200, 4500) && item.text === t.tour.questions[0] ? 'ring-4 ring-highlight/60' : ''}`}
                  >
                    ▲ {item.upvotes}
                  </span>
                </li>
              ))}
            </ol>
          </PhoneScreen>
        );
      },
    },
    {
      duration: 4500,
      caption: s.end,
      render: (e) => (
        <PhoneScreen t={t}>
          <Card title={t.ended.title} body={`${t.ended.body} ${t.ended.redirectIn(Math.max(1, 5 - Math.floor(e / 1000)))}`} />
        </PhoneScreen>
      ),
    },
  ];
}
