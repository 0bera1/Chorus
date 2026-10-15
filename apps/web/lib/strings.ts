/**
 * Arayüz metinleri tek dosyada. Çeviri eklenirse bu nesne uyarlanır.
 */
export const T = {
  brand: 'Chorus',
  slogan: 'Herkesin sesi, tek ekranda.',

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
    connecting: 'Bağlanıyor…',
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
    alreadyVoted: 'Bu slayta zaten oy verdin.',
  },

  qa: {
    askPlaceholder: 'Sorunu yaz…',
    ask: 'Soru sor',
    upvote: 'Beğen',
    upvoted: 'Beğendin',
    empty: 'Henüz soru yok. İlk soruyu sen sor!',
    asked: 'Sorun eklendi.',
  },

  results: {
    total: 'cevap',
    average: 'Ortalama',
    empty: 'Henüz cevap yok',
    hidden: 'Sonuçlar sunum sahibi tarafından gizlendi',
  },

  present: {
    roomCode: 'Oda kodu',
    joinHint: 'Telefonundan tara veya /j adresine gir',
    participants: 'katılımcı',
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
    timeout: 'Sunucu yanıt vermedi, tekrar dene.',
    offline: 'Bağlantı yok, yeniden bağlanılıyor…',
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
    slideCount: 'slayt',
    needKey: 'Bu sunumu düzenlemek için host anahtarı gerekli. Anahtar yalnızca sunumu oluşturduğun tarayıcıda bulunur.',
    newInstead: 'Yeni bir sunum oluştur',
    liveLocked: 'Sunum canlıyken slaytlar düzenlenemez.',
    validationTitle: 'Sunuma bir başlık ver',
    validationQuestion: 'Her slayt için bir soru yaz',
    validationOptions: 'Çoktan seçmeli slaytlarda tüm seçenekleri doldur',
    validationNoSlides: 'Başlatmadan önce en az bir slayt ekle',
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
  },

  nav: {
    home: 'Ana sayfa',
    create: 'Sunum oluştur',
    demo: 'Demoyu dene',
  },
} as const;

/** Sunucu hata kodunu kullanıcıya gösterilecek metne çevirir. */
export function errorMessageFor(code: string | undefined, fallback?: string): string {
  switch (code) {
    case 'not_found':
      return T.errors.notFound;
    case 'room_ended':
      return T.errors.roomEnded;
    case 'room_full':
      return T.errors.roomFull;
    case 'forbidden':
    case 'unauthorized':
      return T.errors.forbidden;
    case 'rate_limited':
      return T.errors.rateLimited;
    case 'timeout':
      return T.errors.timeout;
    case 'offline':
      return T.errors.offline;
    default:
      return fallback ?? T.errors.generic;
  }
}
