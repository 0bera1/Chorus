'use client';

import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PublicSlide, QaQuestion, VotePayload } from '@chorus/shared';
import { T, errorMessageFor } from '@/lib/strings';
import type { Ack } from '@/lib/use-room';

const LETTERS = 'ABCDEFGH';

interface VoteProps {
  slide: PublicSlide;
  myVote: VotePayload | null;
  onVote: (payload: VotePayload) => Promise<Ack>;
}

/** Oy ekranı: slayt tipine göre tek elle dokunulabilir büyük alanlar. */
export function VoteInput({ slide, myVote, onVote }: VoteProps) {
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = myVote !== null && !slide.settings.allowVoteChange;

  const submit = async (payload: VotePayload) => {
    setError(null);
    setBusy(true);
    const res = await onVote(payload);
    setBusy(false);
    if (!res.ok) setError(errorMessageFor(res.error?.code, res.error?.message));
  };

  const submitText = (e: FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    if (slide.type === 'word_cloud') void submit({ type: 'word_cloud', word: value });
    if (slide.type === 'open_text') void submit({ type: 'open_text', text: value });
  };

  return (
    <div className="flex flex-col gap-4">
      {slide.type === 'multiple_choice' && (
        <ul className="flex flex-col gap-3" role="radiogroup" aria-label="Seçenekler">
          {slide.options.map((option, i) => {
            const selected = myVote?.type === 'multiple_choice' && myVote.optionId === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={busy || (locked && !selected)}
                  onClick={() => submit({ type: 'multiple_choice', optionId: option.id })}
                  className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold transition active:scale-[0.99] disabled:opacity-60 ${
                    selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      selected ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent'
                    }`}
                    aria-hidden
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {selected && <span aria-label="Seçili">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {slide.type === 'scale' && (
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Derecelendirme">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = myVote?.type === 'scale' && myVote.value === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${value} / 5`}
                disabled={busy || (locked && !selected)}
                onClick={() => submit({ type: 'scale', value })}
                className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl font-black transition active:scale-95 disabled:opacity-60 ${
                  selected ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface hover:border-accent'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}
      {slide.type === 'scale' && (
        <div className="flex justify-between text-sm text-muted">
          <span>{T.vote.scaleLow}</span>
          <span>{T.vote.scaleHigh}</span>
        </div>
      )}

      {(slide.type === 'word_cloud' || slide.type === 'open_text') && (
        <form onSubmit={submitText} className="flex flex-col gap-3">
          {slide.type === 'word_cloud' ? (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy || locked}
              maxLength={30}
              placeholder={myVote ? '' : T.vote.wordPlaceholder}
              aria-label={T.vote.wordPlaceholder}
              className="min-h-16 w-full rounded-2xl border-2 border-line bg-surface px-5 text-lg outline-none focus:border-accent"
            />
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy || locked}
              maxLength={280}
              rows={4}
              placeholder={T.vote.textPlaceholder}
              aria-label={T.vote.textPlaceholder}
              className="w-full rounded-2xl border-2 border-line bg-surface px-5 py-4 text-lg outline-none focus:border-accent"
            />
          )}
          <button
            type="submit"
            disabled={busy || locked || draft.trim().length === 0}
            className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-accent-fg transition active:scale-[0.99] disabled:opacity-50"
          >
            {T.vote.submit}
          </button>
        </form>
      )}

      <VoteFeedback myVote={myVote} allowChange={slide.settings.allowVoteChange} error={error} />
    </div>
  );
}

function VoteFeedback({
  myVote,
  allowChange,
  error,
}: {
  myVote: VotePayload | null;
  allowChange: boolean;
  error: string | null;
}) {
  const reduce = useReducedMotion();
  if (error) return <p role="alert" className="text-center font-medium text-red-500">{error}</p>;
  if (!myVote) return null;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="rounded-2xl bg-accent-soft px-5 py-4 text-center"
    >
      <p className="font-bold text-accent">{T.vote.thanks}</p>
      {allowChange && <p className="mt-1 text-sm text-muted">{T.vote.changeAllowed}</p>}
    </motion.div>
  );
}

interface QaProps {
  questions: QaQuestion[];
  onAsk: (text: string) => Promise<Ack>;
  onUpvote: (questionId: string) => Promise<Ack>;
}

/** Soru-cevap paneli: soru yaz, beğen, en çok beğenilen üste çıkar. */
export function QaPanel({ questions, onAsk, onUpvote }: QaProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState<Set<string>>(() => new Set());

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 3) return;
    setError(null);
    const res = await onAsk(text.trim());
    if (res.ok) setText('');
    else setError(errorMessageFor(res.error?.code, res.error?.message));
  };

  const upvote = async (id: string) => {
    setError(null);
    const res = await onUpvote(id);
    if (res.ok || res.error?.code === 'already_upvoted') setUpvoted((prev) => new Set(prev).add(id));
    else setError(errorMessageFor(res.error?.code, res.error?.message));
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={ask} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder={T.qa.askPlaceholder}
          aria-label={T.qa.askPlaceholder}
          className="w-full rounded-2xl border-2 border-line bg-surface px-5 py-4 text-lg outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={text.trim().length < 3}
          className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-accent-fg disabled:opacity-50"
        >
          {T.qa.ask}
        </button>
      </form>
      {error && <p role="alert" className="text-center font-medium text-red-500">{error}</p>}

      {questions.length === 0 ? (
        <p className="text-center text-muted">{T.qa.empty}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {questions.map((q) => {
            const done = upvoted.has(q.id) || q.mine;
            return (
              <li key={q.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                <span className="flex-1 text-base">{q.text}</span>
                <button
                  type="button"
                  onClick={() => upvote(q.id)}
                  disabled={done}
                  aria-label={`${T.qa.upvote}: ${q.upvotes}`}
                  className={`min-h-12 min-w-16 rounded-xl px-3 font-bold tabular-nums transition ${
                    done ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent hover:bg-accent hover:text-accent-fg'
                  } disabled:cursor-default`}
                >
                  ▲ {q.upvotes}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

