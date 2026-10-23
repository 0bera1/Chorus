import type { SlideDraft } from './slide-draft';

/** Kullanıcıya gösterilecek doğrulama sorunu. Metin, sözlükten alınır. */
export type DraftProblem = 'title' | 'question' | 'options';

/**
 * Kaydetmeden önce kullanıcıya anlamlı bir sorun döndürür. Sunucu şeması son güvencedir;
 * burada yalnızca yerelleştirilebilir sorun anahtarlarını üretiriz.
 */
export function validateDraft(title: string, slides: SlideDraft[]): DraftProblem | null {
  if (!title.trim()) return 'title';
  if (slides.some((s) => !s.question.trim())) return 'question';
  if (slides.some((s) => s.type === 'multiple_choice' && s.options.some((o) => !o.text.trim()))) {
    return 'options';
  }
  return null;
}
