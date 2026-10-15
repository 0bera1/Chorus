import type { PublicSlide, RoomStatus } from '@chorus/shared';

interface RoomRuntimeInit {
  code: string;
  roomId: string;
  presentationId: string;
  status: RoomStatus;
  slides: PublicSlide[];
  currentIndex: number | null;
}

/**
 * Aktif bir odanın bellekteki durumu. Kalıcı veri PostgreSQL'de; bu sınıf yalnızca
 * anlık durumu (aktif slayt, oylama, bağlı katılımcılar, batch bekleyen slaytlar) tutar.
 */
export class RoomRuntime {
  readonly code: string;
  readonly roomId: string;
  readonly presentationId: string;
  readonly slides: PublicSlide[];

  status: RoomStatus;
  currentIndex: number | null;
  votingOpen = false;
  showResults = false;
  lastActivity = Date.now();

  /** participantId -> açık socket sayısı (aynı katılımcının birden fazla sekmesi olabilir) */
  private readonly connections = new Map<string, number>();
  /** Sonuç güncellemesi bekleyen slayt kimlikleri */
  readonly dirtySlideIds = new Set<string>();
  flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(init: RoomRuntimeInit) {
    this.code = init.code;
    this.roomId = init.roomId;
    this.presentationId = init.presentationId;
    this.status = init.status;
    this.slides = init.slides;
    this.currentIndex = init.currentIndex;
  }

  /** Aktif slayt; ayarlar çalışma zamanı durumundan (oylama/sonuç açık mı) yansıtılır. */
  get currentSlide(): PublicSlide | null {
    if (this.currentIndex === null) return null;
    const slide = this.slides[this.currentIndex];
    if (!slide) return null;
    return {
      ...slide,
      settings: { ...slide.settings, votingOpen: this.votingOpen, showResults: this.showResults },
    };
  }

  get participantCount(): number {
    return this.connections.size;
  }

  touch(): void {
    this.lastActivity = Date.now();
  }

  addConnection(participantId: string): void {
    this.connections.set(participantId, (this.connections.get(participantId) ?? 0) + 1);
  }

  removeConnection(participantId: string): void {
    const remaining = (this.connections.get(participantId) ?? 1) - 1;
    if (remaining <= 0) this.connections.delete(participantId);
    else this.connections.set(participantId, remaining);
  }

  markDirty(slideId: string): void {
    this.dirtySlideIds.add(slideId);
  }

  dispose(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
  }
}
