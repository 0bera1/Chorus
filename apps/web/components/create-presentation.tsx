'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { errorTextFor } from '@/lib/i18n/error-message';
import { useT } from '@/lib/i18n/locale-context';
import { Toolbar } from './toolbar';
import { savePresentationKey } from '@/lib/room-storage';
import { toPayload, type SlideDraft } from '@/lib/slide-draft';
import { validateDraft } from '@/lib/validate-draft';
import { SlideEditor } from './slide-editor';

interface CreatedPresentation {
  id: string;
  hostKey: string;
}

/** Hesapsız sunum oluşturma. Host anahtarı düzenleme linkinin fragment'ına eklenir. */
export function CreatePresentation() {
  const t = useT();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<SlideDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = validateDraft(title, slides);
    if (problem) return setError(t.editor.validation[problem]);

    setBusy(true);
    try {
      const payload = { title: title.trim(), slides: slides.map(toPayload) };
      const created = await api<CreatedPresentation>('/presentations', { method: 'POST', body: payload });
      savePresentationKey(created.id, created.hostKey);
      // Anahtar fragment'ta: sunucuya gönderilmez, yalnızca bu tarayıcıdaki düzenleme linkinde durur
      router.push(`/host/${created.id}#k=${created.hostKey}`);
    } catch (err) {
      setError(errorTextFor(t, err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <Toolbar />
      <h1 className="text-4xl font-black tracking-tight">{t.editor.createTitle}</h1>

      <label className="flex flex-col gap-2 text-sm font-medium">
        {t.editor.titleLabel}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={t.editor.titlePlaceholder}
          className="min-h-14 rounded-2xl border-2 border-line bg-surface px-5 text-lg outline-none focus:border-accent"
        />
      </label>

      <SlideEditor slides={slides} onChange={setSlides} disabled={busy} />

      {error && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-5 py-3 font-medium text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-accent-fg shadow-card disabled:opacity-60"
      >
        {busy ? t.editor.creating : t.editor.create}
      </button>
    </form>
  );
}
