'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { DEMO_PRESENTATION } from '@/lib/demo';
import { T } from '@/lib/strings';
import { saveHostKey } from '@/lib/room-storage';

interface Created {
  id: string;
  hostKey: string;
}

/** Hesapsız demo: örnek sunum oluşturur, oda açar ve sunum ekranına geçer. */
export function DemoStarter() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api<Created>('/presentations', { method: 'POST', body: DEMO_PRESENTATION });
      const room = await api<{ code: string }>(`/presentations/${created.id}/rooms`, {
        method: 'POST',
        hostKey: created.hostKey,
      });
      saveHostKey(room.code, created.hostKey);
      router.push(`/present/${room.code}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.errors.generic);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="min-h-14 rounded-2xl bg-accent px-8 text-lg font-bold text-accent-fg shadow-card disabled:opacity-60"
      >
        {busy ? T.demo.starting : T.demo.start}
      </button>
      {error && (
        <p role="alert" className="font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
