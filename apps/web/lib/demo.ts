import type { Dictionary } from './i18n/dictionaries';

/** Demo sunumu: hesapsız tek tıkla denemek için örnek slaytlar. Otomatik sahte oy üretilmez. */
const settings = { allowVoteChange: true, showResults: false, votingOpen: false, hideOpenText: false };

/** Seçili dildeki metinlerle demo sunumu üretir. */
export function buildDemoPresentation(t: Dictionary) {
  const s = t.demo.slides;
  return {
    title: t.demo.presentationTitle,
    slides: [
      {
        type: 'multiple_choice' as const,
        question: s.choiceQuestion,
        options: s.choiceOptions.map((text, i) => ({ id: String.fromCharCode(97 + i), text })),
        settings,
      },
      {
        type: 'word_cloud' as const,
        question: s.cloudQuestion,
        options: [],
        settings,
      },
      {
        type: 'scale' as const,
        question: s.scaleQuestion,
        options: [],
        settings,
      },
      {
        type: 'open_text' as const,
        question: s.textQuestion,
        options: [],
        settings: { ...settings, hideOpenText: false },
      },
      {
        type: 'qa' as const,
        question: s.qaQuestion,
        options: [],
        settings,
      },
    ],
  };
}
