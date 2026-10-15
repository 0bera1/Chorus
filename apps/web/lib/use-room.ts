'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { PublicSlide, RoomSnapshot, SlideResults, VotePayload } from '@chorus/shared';
import { WS_URL } from './config';
import { getParticipantToken, saveParticipantToken } from './room-storage';

type Role = 'host' | 'participant';

export type ConnState = 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface RoomState {
  conn: ConnState;
  /** Katılım reddedildiyse sunucu hata kodu (ör. room_ended) */
  errorCode: string | null;
  status: RoomSnapshot['status'] | null;
  slide: PublicSlide | null;
  slideIndex: number;
  slideCount: number;
  participantCount: number;
  results: { slideId: string; data: SlideResults } | null;
  myVote: VotePayload | null;
  ended: boolean;
}

export interface Ack {
  ok: boolean;
  error?: { code: string; message: string };
  [key: string]: unknown;
}

/** Bu kodlarda yeniden denemek anlamsız: kullanıcıya hata ekranı gösterilir. */
const FATAL_CODES = new Set(['not_found', 'room_ended', 'room_full', 'forbidden', 'unauthorized']);

const initialState: RoomState = {
  conn: 'connecting',
  errorCode: null,
  status: null,
  slide: null,
  slideIndex: -1,
  slideCount: 0,
  participantCount: 0,
  results: null,
  myVote: null,
  ended: false,
};

interface Options {
  code: string;
  role: Role;
  hostKey?: string;
  nickname?: string;
  /** false ise bağlantı kurulmaz (katılımcı önce takma ad girer) */
  enabled: boolean;
}

/**
 * Oda bağlantısı: katılma, otomatik yeniden bağlanma ve olay dinleme.
 * Katılımcı yeniden bağlanınca token ile aynı kimliğe döner ve durum geri yüklenir.
 */
export function useRoom({ code, role, hostKey, nickname, enabled }: Options) {
  const [state, setState] = useState<RoomState>(initialState);
  const socketRef = useRef<Socket | null>(null);
  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;

  useEffect(() => {
    if (!enabled) return;

    const socket = io(WS_URL, { transports: ['websocket'], reconnectionDelayMax: 5000 });
    socketRef.current = socket;

    const join = () => {
      const payload =
        role === 'host'
          ? { code, role: 'host' as const, hostKey: hostKey ?? '' }
          : {
              code,
              role: 'participant' as const,
              token: getParticipantToken(code) ?? undefined,
              nickname: nicknameRef.current || undefined,
            };

      socket.emit('room:join', payload, (res: Ack & { token?: string; snapshot?: RoomSnapshot }) => {
        if (!res.ok || !res.snapshot) {
          const errorCode = res.error?.code ?? 'generic';
          setState((prev) => ({ ...prev, conn: 'error', errorCode }));
          if (FATAL_CODES.has(errorCode)) socket.disconnect();
          return;
        }
        if (res.token && role === 'participant') saveParticipantToken(code, res.token);
        applySnapshot(res.snapshot);
      });
    };

    const applySnapshot = (snap: RoomSnapshot) => {
      setState({
        conn: 'connected',
        errorCode: null,
        status: snap.status,
        slide: snap.currentSlide,
        slideIndex: snap.currentSlide ? snap.currentSlide.position : -1,
        slideCount: snap.slideCount,
        participantCount: snap.participantCount,
        results:
          snap.results && snap.currentSlide ? { slideId: snap.currentSlide.id, data: snap.results } : null,
        myVote: snap.myVote,
        ended: false,
      });
    };

    socket.on('connect', join);
    socket.on('disconnect', () => {
      setState((prev) => (prev.errorCode ? prev : { ...prev, conn: 'reconnecting' }));
    });

    socket.on('slide:changed', (slide: PublicSlide | null, index: number) => {
      setState((prev) => {
        const sameSlide = prev.slide?.id === slide?.id;
        const hideResults =
          role === 'participant' && slide !== null && slide.type !== 'qa' && !slide.settings.showResults;
        return {
          ...prev,
          slide,
          slideIndex: index,
          myVote: sameSlide ? prev.myVote : null,
          results: sameSlide && !hideResults ? prev.results : null,
        };
      });
    });

    socket.on('results:update', ({ slideId, results }: { slideId: string; results: SlideResults }) => {
      setState((prev) => (prev.slide?.id === slideId ? { ...prev, results: { slideId, data: results } } : prev));
    });

    socket.on('participants:count', ({ count }: { count: number }) => {
      setState((prev) => ({ ...prev, participantCount: count }));
    });

    socket.on('room:ended', () => {
      setState((prev) => ({ ...prev, ended: true, slide: null, results: null }));
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, role, hostKey, enabled]);

  /** Ack'li olay gönderir; zaman aşımı ve bağlantı yokluğu da hata olarak döner. */
  const emit = useCallback(
    (event: string, payload: unknown = {}): Promise<Ack> =>
      new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve({ ok: false, error: { code: 'offline', message: 'offline' } });
          return;
        }
        socket
          .timeout(5000)
          .emit(event, payload, (err: Error | null, res: Ack) => {
            if (err) resolve({ ok: false, error: { code: 'timeout', message: 'timeout' } });
            else resolve(res);
          });
      }),
    [],
  );

  const actions = {
    vote: async (payload: VotePayload) => {
      const res = await emit('vote:submit', { payload });
      if (res.ok) setState((prev) => ({ ...prev, myVote: payload }));
      return res;
    },
    ask: (text: string) => emit('qa:ask', { text }),
    upvote: (questionId: string) => emit('qa:upvote', { questionId }),
    setSlide: (slideIndex: number) => emit('host:setSlide', { slideIndex }),
    toggleVoting: (open: boolean) => emit('host:toggleVoting', { open }),
    toggleResults: (show: boolean) => emit('host:toggleResults', { show }),
    endRoom: () => emit('host:endRoom'),
  };

  return { state, actions };
}
