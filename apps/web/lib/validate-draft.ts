import { T } from './strings';
import type { SlideDraft } from './slide-draft';

/**
 * Kaydetmeden önce Türkçe kullanıcı mesajları üretir. Sunucu şeması son güvencedir;
 * burada yalnızca kullanıcıya anlamlı, yerelleştirilmiş mesajları öne çıkarırız.
 */
export function validateDraft(title: string, slides: SlideDraft[]): string | null {
  if (!title.trim()) return T.editor.validationTitle;
  if (slides.some((s) => !s.question.trim())) return T.editor.validationQuestion;
  if (slides.some((s) => s.type === 'multiple_choice' && s.options.some((o) => !o.text.trim()))) {
    return T.editor.validationOptions;
  }
  return null;
}
