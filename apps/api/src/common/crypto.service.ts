import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@chorus/shared';
import { config } from '../config';

/**
 * Host anahtarları ve katılımcı token'ları düz metin saklanmaz; HMAC ile hash'lenir.
 */
@Injectable()
export class CryptoService {
  constructor() {
    if (!config.tokenSecret) {
      throw new Error('TOKEN_SECRET tanımlı değil (.env dosyasına ekleyin)');
    }
  }

  /** İstemciye verilecek gizli anahtar (256 bit) */
  newSecret(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(value: string): string {
    return createHmac('sha256', config.tokenSecret).update(value).digest('hex');
  }

  /** Sabit süreli karşılaştırma (zamanlama saldırılarına karşı) */
  matches(value: string, storedHash: string): boolean {
    const a = Buffer.from(this.hash(value), 'hex');
    const b = Buffer.from(storedHash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Okunabilir 6 haneli oda kodu */
  newRoomCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
    }
    return code;
  }
}
