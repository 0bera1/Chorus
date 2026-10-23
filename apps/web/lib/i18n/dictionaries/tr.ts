/**
 * Kaynak sözlük (Türkçe). Diğer dillerin tipi buradan çıkar: bir anahtar eklenirse
 * tüm dil dosyalarında da karşılığı yazılmak zorundadır.
 */
export const tr = {
  brand: 'Chorus',
  slogan: 'Herkesin sesi, tek ekranda.',
  languageLabel: 'Dil',

  landing: {
    heroTitle: 'Herkesin sesi, tek ekranda.',
    heroBody: 'Sunumunu başlat, katılımcılar QR kodla telefonundan girsin. Oylar ve cevaplar anında canlı grafiğe dönüşsün.',
    joinLabel: 'Oda kodu',
    joinPlaceholder: 'ABC123',
    joinButton: 'Odaya katıl',
    joinHint: 'Hesap gerekmez. Oda kodunu sunum sahibinden al.',
  },

  join: {
    title: 'Odaya katıl',
    nicknameLabel: 'Takma ad (isteğe bağlı)',
    nicknamePlaceholder: 'Adın ya da bir lakap',
    enter: 'Katıl',
  },

  conn: {
    connected: 'Canlı',
    connecting: 'Bağlanıyor…',
    reconnecting: 'Yeniden bağlanıyor…',
    error: 'Bağlantı kurulamadı',
  },

  waiting: {
    title: 'Sunum bekleniyor',
    body: 'Sunum sahibi ilk slaytı açınca burada görünecek.',
  },

  vote: {
    thanks: 'Teşekkürler! Oyun alındı.',
    changeAllowed: 'Oyunu istediğin zaman değiştirebilirsin.',
    closed: 'Oylama kapalı',
    closedBody: 'Sunum sahibi oylamayı açınca oy verebilirsin.',
    scaleLow: 'Hiç',
    scaleHigh: 'Çok',
    textPlaceholder: 'Cevabını yaz',
    wordPlaceholder: 'Tek bir kelime',
    submit: 'Gönder',
  },

  qa: {
    askPlaceholder: 'Sorunu yaz…',
    ask: 'Soru sor',
    upvote: 'Beğen',
    upvoted: 'Beğendin',
    empty: 'Henüz soru yok. İlk soruyu sen sor!',
  },

  results: {
    average: 'Ortalama',
    empty: 'Henüz cevap yok',
    responses: (n: number) => `${n} cevap`,
  },

  present: {
    roomCode: 'Oda kodu',
    joinHint: 'Telefonundan tara veya /j adresine gir',
    participants: (n: number) => `${n} katılımcı`,
    previous: 'Önceki',
    next: 'Sonraki',
    votingOn: 'Oylamayı kapat',
    votingOff: 'Oylamayı aç',
    resultsShow: 'Sonuçları göster',
    resultsHide: 'Sonuçları gizle',
    endRoom: 'Odayı bitir',
    endConfirm: 'Oda kapatılsın mı? Katılımcılar artık oy veremeyecek.',
    noKey: 'Bu oda için host anahtarı bu tarayıcıda bulunamadı. Sunumu bu tarayıcıdan başlatman gerekiyor.',
  },

  ended: {
    title: 'Sunum sona erdi',
    body: 'Katıldığın için teşekkürler!',
    redirectIn: (seconds: number) => `Anasayfaya yönlendiriliyorsunuz… ${seconds}`,
  },

  errors: {
    notFound: 'Oda bulunamadı',
    notFoundBody: 'Kodu kontrol edip tekrar dene.',
    roomEnded: 'Oda kapandı',
    roomEndedBody: 'Bu sunum artık aktif değil.',
    roomFull: 'Oda dolu',
    roomFullBody: 'Bu oda şu an katılımcı kabul etmiyor.',
    forbidden: 'Yetkisiz erişim',
    forbiddenBody: 'Bu sayfa için host anahtarı gerekli.',
    rateLimited: 'Çok hızlı işlem yapıyorsun, biraz bekle.',
    generic: 'Bir sorun oluştu. Lütfen tekrar dene.',
    offline: 'Bağlantı yok, yeniden bağlanılıyor…',
    voteClosed: 'Oylama kapalı',
    alreadyVoted: 'Bu slayta zaten oy verdin.',
    alreadyUpvoted: 'Bu soruyu zaten beğendin.',
    notQa: 'Bu slaytta şu an bu işlem yapılamaz.',
    noActiveSlide: 'Aktif slayt yok.',
    validation: 'Girdiğin bilgileri kontrol et.',
  },

  editor: {
    createTitle: 'Yeni sunum',
    editTitle: 'Sunumu düzenle',
    titleLabel: 'Sunum başlığı',
    titlePlaceholder: 'Örn. Ekip toplantısı',
    addSlide: 'Slayt ekle',
    empty: 'Henüz slayt yok. Yukarıdan bir tip seçip ekle.',
    questionLabel: 'Soru',
    questionPlaceholder: 'Sorunu yaz',
    optionPlaceholder: 'Seçenek',
    addOption: 'Seçenek ekle',
    removeOption: 'Sil',
    removeSlide: 'Slaytı sil',
    moveUp: 'Yukarı taşı',
    moveDown: 'Aşağı taşı',
    allowVoteChange: 'Katılımcı oyunu değiştirebilsin',
    hideOpenText: 'Açık uçlu cevapları katılımcılardan gizle',
    save: 'Kaydet',
    saving: 'Kaydediliyor…',
    saved: 'Kaydedildi',
    start: 'Sunumu başlat',
    starting: 'Oda açılıyor…',
    create: 'Sunumu oluştur',
    creating: 'Oluşturuluyor…',
    loading: 'Sunum yükleniyor…',
    slideCount: (n: number) => `${n} slayt`,
    needKey: 'Bu sunumu düzenlemek için host anahtarı gerekli. Anahtar yalnızca sunumu oluşturduğun tarayıcıda bulunur.',
    newInstead: 'Yeni bir sunum oluştur',
    validation: {
      title: 'Sunuma bir başlık ver',
      question: 'Her slayt için bir soru yaz',
      options: 'Çoktan seçmeli slaytlarda tüm seçenekleri doldur',
      noSlides: 'Başlatmadan önce en az bir slayt ekle',
    },
    hints: {
      multiple_choice: 'Katılımcılar seçeneklerden birini seçer.',
      word_cloud: 'Katılımcılar tek bir kelime girer; sık yazılanlar büyür.',
      scale: 'Katılımcılar 1 ile 5 arasında puan verir.',
      open_text: 'Katılımcılar serbest metin yazar; cevaplar canlı akar.',
      qa: 'Katılımcılar soru sorar, diğerleri beğenir.',
    },
    typeLabels: {
      multiple_choice: 'Çoktan seçmeli',
      word_cloud: 'Kelime bulutu',
      scale: 'Ölçek',
      open_text: 'Açık uçlu',
      qa: 'Soru-cevap',
    },
  },

  demo: {
    title: 'Demo sunum',
    body: 'Hesap açmadan hemen dene. Örnek slaytlarla bir oda açılır; sunum ekranı ve katılımcı ekranı hazır gelir.',
    start: 'Demo odasını başlat',
    starting: 'Demo hazırlanıyor…',
    presentationTitle: 'Chorus demo',
    slides: {
      choiceQuestion: 'Bir sunumda en çok neyi seversin?',
      choiceOptions: ['Canlı grafikleri', 'Kısa ve net konuşmayı', 'Etkileşimli soruları', 'Hikâye anlatımını'],
      cloudQuestion: 'Bu sunumu tek bir kelimeyle anlat',
      scaleQuestion: 'Bu sunum ne kadar faydalı oldu? (1-5)',
      textQuestion: 'Eklemek istediğin bir fikir var mı?',
      qaQuestion: 'Bize bir soru sor',
    },
  },

  tour: {
    open: 'Öğret',
    chooseTitle: 'Öğreticiyi nasıl izlemek istersin?',
    chooseBody: 'Sahnede gerçek bir sunum canlandırılacak. Sunumu yapan ya da dinleyen olarak izleyebilirsin.',
    presenterRole: { title: 'Sunumu yapan', body: 'Odayı aç, oylamayı başlat, sonuçları canlı izle.' },
    participantRole: { title: 'Dinleyen', body: 'Telefondan katıl, oy ver, soru sor, sonuçları gör.' },
    back: 'Rol seçimi',
    play: 'Oynat',
    pause: 'Duraklat',
    next: 'İleri',
    prev: 'Geri',
    finish: 'Bitir',
    close: 'Kapat',
    stepOf: (current: number, total: number) => `${current} / ${total}`,
    words: ['net', 'ilham verici', 'uzun', 'etkileşimli', 'faydalı', 'sıkıcı'],
    questions: ['Bu konuyu bir örnekle anlatır mısınız?', 'Slaytlar paylaşılacak mı?', 'Sunum kaç dakika sürecek?'],
    myQuestion: 'Slaytları daha sonra alabilir miyiz?',
    myWord: 'ilham verici',
    nickname: 'Ayşe',
    presenterScenes: {
      lobby: 'Oda açılır. Katılımcılar QR kodu okutup oda koduyla katılır.',
      open: 'Oylamayı açmadan katılımcılar oy veremez. "Oylamayı aç" ile soruyu yayına alırsın.',
      live: 'Oylar geldikçe grafik anında güncellenir.',
      results: 'Sonuçları katılımcılara da gösterebilirsin; sen her zaman canlı görürsün.',
      wordCloud: 'Kelimeler birleşir; sık yazılanlar büyür.',
      scale: 'Ölçek sorularında ortalama puan canlı hesaplanır.',
      qa: 'Soru-cevapta katılımcılar soru sorar, diğerleri beğenir.',
      end: 'Sunum bitince odayı kapatırsın; katılımcılar ana sayfaya yönlendirilir.',
    },
    participantScenes: {
      join: 'Oda kodunu girip takma adını yazarsın, sonra katılırsın. Hesap gerekmez.',
      closed: 'Sunum sahibi oylamayı açmadan oy veremezsin.',
      vote: 'Seçeneğe dokunarak oy verirsin; istersen oyunu sonradan değiştirebilirsin.',
      results: 'Sunum sahibi sonuçları gösterince grafiği telefonunda da görürsün.',
      wordCloud: 'Tek bir kelime yazıp gönderirsin.',
      scale: '1 ile 5 arasında puan verirsin.',
      qa: 'Soru yazıp gönderirsin; diğer soruları beğenerek öne çıkarabilirsin.',
      end: 'Sunum bittiğinde ana sayfaya yönlendirilirsin.',
    },
  },

  theme: {
    label: 'Tema',
    light: 'Açık',
    dark: 'Koyu',
  },

  nav: {
    create: 'Sunum oluştur',
    demo: 'Demoyu dene',
  },

  a11y: {
    controls: 'Sunum kontrolleri',
    options: 'Seçenekler',
    selected: 'Seçili',
    rating: 'Derecelendirme',
    results: 'Sonuç grafiği',
  },
};

export type Dictionary = typeof tr;
