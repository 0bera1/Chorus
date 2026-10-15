/** Demo sunumu: hesapsız tek tıkla denemek için örnek slaytlar. Otomatik sahte oy üretilmez. */
const settings = { allowVoteChange: true, showResults: false, votingOpen: false, hideOpenText: false };

export const DEMO_PRESENTATION = {
  title: 'Chorus demo',
  slides: [
    {
      type: 'multiple_choice' as const,
      question: 'Bir sunumda en çok neyi seversin?',
      options: [
        { id: 'a', text: 'Canlı grafikleri' },
        { id: 'b', text: 'Kısa ve net konuşmayı' },
        { id: 'c', text: 'Etkileşimli soruları' },
        { id: 'd', text: 'Hikâye anlatımını' },
      ],
      settings,
    },
    {
      type: 'word_cloud' as const,
      question: 'Bu sunumu tek bir kelimeyle anlat',
      options: [],
      settings,
    },
    {
      type: 'scale' as const,
      question: 'Bu sunum ne kadar faydalı oldu? (1-5)',
      options: [],
      settings,
    },
    {
      type: 'open_text' as const,
      question: 'Eklemek istediğin bir fikir var mı?',
      options: [],
      settings: { ...settings, hideOpenText: false },
    },
    {
      type: 'qa' as const,
      question: 'Bize bir soru sor',
      options: [],
      settings,
    },
  ],
};
