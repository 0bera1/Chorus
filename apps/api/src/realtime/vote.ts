import type { PublicSlide, SlideResults, VotePayload } from '@chorus/shared';

/** Kullanıcı metnini temizler: HTML etiketlerini ve kontrol karakterlerini atar. Çıktı React'ta ayrıca escape edilir. */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex -- control characters are the point of this filter
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type NormalizeResult = { ok: true; payload: VotePayload } | { ok: false; message: string };

/** Oyu slayt kurallarına göre doğrular ve normalize eder. */
export function normalizeVote(slide: PublicSlide, payload: VotePayload): NormalizeResult {
  if (payload.type !== slide.type) {
    return { ok: false, message: 'Bu slayt bu cevap tipini kabul etmiyor' };
  }

  switch (payload.type) {
    case 'multiple_choice': {
      const valid = slide.options.some((option) => option.id === payload.optionId);
      return valid ? { ok: true, payload } : { ok: false, message: 'Geçersiz seçenek' };
    }
    case 'word_cloud': {
      // Word clouds take a single word: keep the first token, lowercased
      const word = sanitizeText(payload.word).split(' ')[0]?.toLowerCase() ?? '';
      return word ? { ok: true, payload: { type: 'word_cloud', word } } : { ok: false, message: 'Kelime boş olamaz' };
    }
    case 'open_text': {
      const text = sanitizeText(payload.text);
      return text ? { ok: true, payload: { type: 'open_text', text } } : { ok: false, message: 'Cevap boş olamaz' };
    }
    case 'scale':
      return { ok: true, payload };
  }
}

export type VoteAction = 'insert' | 'update' | 'reject';

/**
 * Oy kaydı kararı. Insert, (slide_id, participant_id) unique kısıtına çarparsa
 * `alreadyVoted` true olur; slayt oy değişimine izin veriyorsa güncellenir, aksi halde reddedilir.
 */
export function resolveVoteAction(input: { alreadyVoted: boolean; allowVoteChange: boolean }): VoteAction {
  if (!input.alreadyVoted) return 'insert';
  return input.allowVoteChange ? 'update' : 'reject';
}

/** Ham oy kayıtlarından slayt sonuçlarını hesaplar (Q&A hariç; onun için ayrı akış var). */
export function aggregateResults(
  slide: PublicSlide,
  responses: { id: string; payload: VotePayload }[],
): SlideResults {
  switch (slide.type) {
    case 'multiple_choice': {
      const counts: Record<string, number> = {};
      for (const option of slide.options) counts[option.id] = 0;
      for (const { payload } of responses) {
        if (payload.type === 'multiple_choice') counts[payload.optionId] = (counts[payload.optionId] ?? 0) + 1;
      }
      return { type: 'multiple_choice', total: responses.length, counts };
    }
    case 'word_cloud': {
      const tally = new Map<string, number>();
      for (const { payload } of responses) {
        if (payload.type === 'word_cloud') tally.set(payload.word, (tally.get(payload.word) ?? 0) + 1);
      }
      const words = [...tally.entries()]
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
        .slice(0, 60);
      return { type: 'word_cloud', total: responses.length, words };
    }
    case 'scale': {
      const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      let sum = 0;
      let count = 0;
      for (const { payload } of responses) {
        if (payload.type !== 'scale') continue;
        distribution[String(payload.value)] = (distribution[String(payload.value)] ?? 0) + 1;
        sum += payload.value;
        count++;
      }
      const average = count === 0 ? 0 : Math.round((sum / count) * 100) / 100;
      return { type: 'scale', total: count, average, distribution };
    }
    case 'open_text': {
      const texts = responses.flatMap(({ id, payload }) =>
        payload.type === 'open_text' ? [{ id, text: payload.text }] : [],
      );
      return { type: 'open_text', total: texts.length, texts };
    }
    case 'qa':
      throw new Error('Q&A sonuçları aggregateResults ile hesaplanmaz');
  }
}
