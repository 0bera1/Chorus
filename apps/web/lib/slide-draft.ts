import type { SlideType } from '@chorus/shared';

/** Editörde düzenlenen slayt. Sunucuya gönderilmeden önce toPayload ile dönüştürülür. */
export interface SlideDraft {
  /** Yalnızca React listesi için istemci anahtarı */
  key: string;
  type: SlideType;
  question: string;
  options: { id: string; text: string }[];
  allowVoteChange: boolean;
  hideOpenText: boolean;
}

export const SLIDE_TYPES: SlideType[] = ['multiple_choice', 'word_cloud', 'scale', 'open_text', 'qa'];

export const MAX_OPTIONS = 8;
export const MIN_OPTIONS = 2;

/** Kısa rastgele kimlik. crypto.randomUUID yalnızca güvenli bağlamda var; LAN IP'den açıldığında yok. */
export const uid = () => Math.random().toString(36).slice(2, 10);

export function newSlide(type: SlideType): SlideDraft {
  return {
    key: uid(),
    type,
    question: '',
    options: type === 'multiple_choice' ? [{ id: uid(), text: '' }, { id: uid(), text: '' }] : [],
    allowVoteChange: false,
    hideOpenText: false,
  };
}

export function toPayload(draft: SlideDraft) {
  const isChoice = draft.type === 'multiple_choice';
  return {
    type: draft.type,
    question: draft.question.trim(),
    options: isChoice ? draft.options.map((o) => ({ id: o.id, text: o.text.trim() })) : [],
    settings: {
      allowVoteChange: draft.allowVoteChange,
      showResults: false,
      votingOpen: false,
      hideOpenText: draft.type === 'open_text' ? draft.hideOpenText : false,
    },
  };
}

/** Sunucudan gelen slaytı editör taslağına çevirir. */
export function fromServer(slide: {
  type: SlideType;
  question: string;
  options: { id: string; text: string }[];
  settings: { allowVoteChange: boolean; hideOpenText: boolean };
}): SlideDraft {
  return {
    key: uid(),
    type: slide.type,
    question: slide.question,
    options: slide.options.map((o) => ({ id: o.id, text: o.text })),
    allowVoteChange: slide.settings.allowVoteChange,
    hideOpenText: slide.settings.hideOpenText,
  };
}
