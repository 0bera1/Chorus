/**
 * Chorus Socket.IO olay sözleşmesi — tek kaynak.
 * Hem api (gateway) hem web (client) bu tipleri kullanır.
 */
import type { RoomStatus, SlideType, VotePayload } from './types';

export type Role = 'host' | 'participant';

/** Sunucu → istemci: aktif slaytın istemciye gösterilen hali (cevap sonucu hariç) */
export interface PublicSlide {
  id: string;
  position: number;
  type: SlideType;
  question: string;
  options: { id: string; text: string }[];
  settings: { allowVoteChange: boolean; showResults: boolean; votingOpen: boolean; hideOpenText: boolean };
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  role: Role;
  currentSlide: PublicSlide | null;
  slideCount: number;
  participantCount: number;
  /** Bu katılımcının mevcut slayttaki oyu (varsa) */
  myVote: VotePayload | null;
  results: SlideResults | null;
}

export type SlideResults =
  | { type: 'multiple_choice'; total: number; counts: Record<string, number> }
  | { type: 'word_cloud'; total: number; words: { word: string; count: number }[] }
  | { type: 'scale'; total: number; average: number; distribution: Record<string, number> }
  | { type: 'open_text'; total: number; texts: { id: string; text: string }[] }
  | { type: 'qa'; total: number; questions: QaQuestion[] };

export interface QaQuestion {
  id: string;
  text: string;
  upvotes: number;
  hidden: boolean;
  mine: boolean;
}

/* ---------- İstemci → sunucu (olay adı: payload → ack) ---------- */

export interface ClientToServerEvents {
  'room:join': (
    payload: { code: string; token?: string; role: 'host'; hostKey: string } | { code: string; token?: string; role: 'participant'; nickname?: string },
    ack: (res: Ack<{ token: string; snapshot: RoomSnapshot }>) => void,
  ) => void;
  'host:setSlide': (payload: { slideIndex: number }, ack: (res: Ack) => void) => void;
  'host:toggleVoting': (payload: { open: boolean }, ack: (res: Ack) => void) => void;
  'host:toggleResults': (payload: { show: boolean }, ack: (res: Ack) => void) => void;
  'host:endRoom': (payload: Record<string, never>, ack: (res: Ack) => void) => void;
  'vote:submit': (payload: { payload: VotePayload }, ack: (res: Ack<{ accepted: true }>) => void) => void;
  'qa:ask': (payload: { text: string }, ack: (res: Ack<{ id: string }>) => void) => void;
  'qa:upvote': (payload: { questionId: string }, ack: (res: Ack) => void) => void;
}

/* ---------- Sunucu → istemci ---------- */

export interface ServerToClientEvents {
  'room:state': (snapshot: RoomSnapshot) => void;
  'slide:changed': (slide: PublicSlide | null, index: number) => void;
  'vote:ack': (payload: { accepted: true }) => void;
  /** Batch'lenmiş (150-250 ms) sonuç güncellemesi */
  'results:update': (payload: { slideId: string; results: SlideResults }) => void;
  'participants:count': (payload: { count: number }) => void;
  'room:ended': () => void;
  'error:message': (payload: { code: string; message: string }) => void;
}

export type Ack<T = unknown> = ({ ok: true } & (T extends undefined ? object : T)) | { ok: false; error: ApiErrorBody };

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export const RESULTS_BATCH_INTERVAL_MS = 200;
export const MAX_PARTICIPANTS_PER_ROOM = 500;
