export type { SlideType, RoomStatus, SlideInput, Slide, VotePayload, CreatePresentationInput } from './schemas';
export {
  SLIDE_TYPES,
  ROOM_STATUSES,
  ROOM_CODE_LENGTH,
  ROOM_CODE_ALPHABET,
  LIMITS,
  slideInputSchema,
  createPresentationSchema,
  updateSlidesSchema,
  votePayloadSchema,
  qaQuestionSchema,
  roomCodeSchema,
} from './schemas';

/** REST yanıtları */
export interface PresentationCreated {
  id: string;
  hostKey: string;
}

export interface RoomCreated {
  id: string;
  code: string;
  joinUrl: string;
  qrData: string;
}

export interface RoomInfo {
  code: string;
  status: 'lobby' | 'live' | 'ended';
  exists: boolean;
}
