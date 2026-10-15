/**
 * Tarayıcı depolama yardımcıları. Her erişim try/catch içinde: özel pencere,
 * engellenmiş site verisi veya önizleme ortamlarında localStorage hata verebilir.
 */

const tokenKey = (code: string) => `chorus.token.${code}`;
const hostKeyKey = (code: string) => `chorus.host.${code}`;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* depolama yoksa sessizce geç: oturum yine de çalışır */
  }
}

/** Katılımcının anonim oturum token'ı (yeniden bağlanmada aynı kimliği korur). */
export const getParticipantToken = (code: string) => read(tokenKey(code));
export const saveParticipantToken = (code: string, token: string) => write(tokenKey(code), token);

/** Host anahtarı yalnızca bu tarayıcıda tutulur; sunucu düz metin saklamaz. */
export const getHostKey = (code: string) => read(hostKeyKey(code));
export const saveHostKey = (code: string, key: string) => write(hostKeyKey(code), key);

/** Sunum düzenleme anahtarı (sunum kimliğine göre); düzenleme linkine de eklenir. */
const presentationKeyKey = (id: string) => `chorus.pkey.${id}`;
export const getPresentationKey = (id: string) => read(presentationKeyKey(id));
export const savePresentationKey = (id: string, key: string) => write(presentationKeyKey(id), key);
