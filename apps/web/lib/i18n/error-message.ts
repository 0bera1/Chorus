import { ApiError } from '../api';
import type { Dictionary } from './dictionaries';

/** Sunucu hata kodunu yerel metne çevirir. Bilinmeyen kodlar genel hata metnine düşer. */
export function errorMessageFor(t: Dictionary, code: string | undefined): string {
  switch (code) {
    case 'not_found':
      return t.errors.notFound;
    case 'room_ended':
      return t.errors.roomEnded;
    case 'room_full':
      return t.errors.roomFull;
    case 'forbidden':
    case 'unauthorized':
      return t.errors.forbidden;
    case 'rate_limited':
      return t.errors.rateLimited;
    case 'network':
      return t.errors.offline;
    case 'voting_closed':
      return t.errors.voteClosed;
    case 'already_voted':
      return t.errors.alreadyVoted;
    case 'already_upvoted':
      return t.errors.alreadyUpvoted;
    case 'not_qa_slide':
      return t.errors.notQa;
    case 'no_active_slide':
      return t.errors.noActiveSlide;
    case 'validation_error':
      return t.errors.validation;
    default:
      return t.errors.generic;
  }
}

/** Yakalanan bir hatayı kullanıcıya gösterilecek metne çevirir. */
export function errorTextFor(t: Dictionary, err: unknown): string {
  return err instanceof ApiError ? errorMessageFor(t, err.code) : t.errors.generic;
}
