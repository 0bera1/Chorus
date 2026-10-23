'use client';

import type { SlideType } from '@chorus/shared';
import { useT } from '@/lib/i18n/locale-context';
import { MAX_OPTIONS, MIN_OPTIONS, SLIDE_TYPES, newSlide, uid, type SlideDraft } from '@/lib/slide-draft';

interface Props {
  slides: SlideDraft[];
  onChange: (slides: SlideDraft[]) => void;
  disabled?: boolean;
}

const field =
  'w-full rounded-xl border-2 border-line bg-bg px-4 py-3 text-base outline-none focus:border-accent disabled:opacity-60';
const smallBtn =
  'min-h-10 rounded-lg border border-line px-3 text-sm font-semibold transition hover:border-accent disabled:opacity-40';

/** Slayt editörü: ekle, sırala, sil, tip seç, seçenekleri düzenle. */
export function SlideEditor({ slides, onChange, disabled = false }: Props) {
  const t = useT();

  const update = (index: number, patch: Partial<SlideDraft>) =>
    onChange(slides.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  const remove = (index: number) => onChange(slides.filter((_, i) => i !== index));

  const add = (type: SlideType) => onChange([...slides, newSlide(type)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.editor.addSlide}>
        {SLIDE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={disabled || slides.length >= 60}
            onClick={() => add(type)}
            className="min-h-11 rounded-xl border-2 border-dashed border-line px-4 font-semibold transition hover:border-accent hover:text-accent disabled:opacity-40"
          >
            + {t.editor.typeLabels[type]}
          </button>
        ))}
      </div>

      {slides.length === 0 && <p className="rounded-2xl bg-surface p-6 text-center text-muted">{t.editor.empty}</p>}

      <ol className="flex flex-col gap-5">
        {slides.map((slide, index) => (
          <li key={slide.key} className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft font-bold text-accent">
                  {index + 1}
                </span>
                <span className="font-semibold">{t.editor.typeLabels[slide.type]}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" className={smallBtn} onClick={() => move(index, -1)} disabled={disabled || index === 0} aria-label={t.editor.moveUp}>
                  ↑
                </button>
                <button
                  type="button"
                  className={smallBtn}
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === slides.length - 1}
                  aria-label={t.editor.moveDown}
                >
                  ↓
                </button>
                <button type="button" className={`${smallBtn} text-red-500`} onClick={() => remove(index)} disabled={disabled}>
                  {t.editor.removeSlide}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                {t.editor.questionLabel}
                <textarea
                  value={slide.question}
                  onChange={(e) => update(index, { question: e.target.value })}
                  maxLength={300}
                  rows={2}
                  disabled={disabled}
                  placeholder={t.editor.questionPlaceholder}
                  className={field}
                />
              </label>

              <p className="text-sm text-muted">{t.editor.hints[slide.type]}</p>

              {slide.type === 'multiple_choice' && (
                <div className="flex flex-col gap-2">
                  {slide.options.map((option, optIndex) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="w-7 text-center font-bold text-muted">{String.fromCharCode(65 + optIndex)}</span>
                      <input
                        value={option.text}
                        maxLength={120}
                        disabled={disabled}
                        aria-label={`${t.editor.optionPlaceholder} ${optIndex + 1}`}
                        placeholder={`${t.editor.optionPlaceholder} ${optIndex + 1}`}
                        onChange={(e) =>
                          update(index, {
                            options: slide.options.map((o) => (o.id === option.id ? { ...o, text: e.target.value } : o)),
                          })
                        }
                        className={field}
                      />
                      <button
                        type="button"
                        className={smallBtn}
                        disabled={disabled || slide.options.length <= MIN_OPTIONS}
                        onClick={() => update(index, { options: slide.options.filter((o) => o.id !== option.id) })}
                      >
                        {t.editor.removeOption}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={`${smallBtn} self-start`}
                    disabled={disabled || slide.options.length >= MAX_OPTIONS}
                    onClick={() => update(index, { options: [...slide.options, { id: uid(), text: '' }] })}
                  >
                    + {t.editor.addOption}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {slide.type !== 'qa' && slide.type !== 'word_cloud' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={slide.allowVoteChange}
                      disabled={disabled}
                      onChange={(e) => update(index, { allowVoteChange: e.target.checked })}
                      className="h-5 w-5 accent-[var(--accent)]"
                    />
                    {t.editor.allowVoteChange}
                  </label>
                )}
                {slide.type === 'open_text' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={slide.hideOpenText}
                      disabled={disabled}
                      onChange={(e) => update(index, { hideOpenText: e.target.checked })}
                      className="h-5 w-5 accent-[var(--accent)]"
                    />
                    {t.editor.hideOpenText}
                  </label>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
