'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { errorTextFor } from '@/lib/i18n/error-message';
import { useT } from '@/lib/i18n/locale-context';
import { getPresentationKey, saveHostKey, savePresentationKey } from '@/lib/room-storage';
import { fromServer, toPayload, type SlideDraft } from '@/lib/slide-draft';
import { validateDraft } from '@/lib/validate-draft';
import { SlideEditor } from './slide-editor';

interface PresentationDto {
  id: string;
  title: string;
  slides: Parameters<typeof fromServer>[0][];
}

/** Host düzenleme ekranı: slaytları düzenle, kaydet, odayı başlat. */
export function HostPresentation({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const [hostKey, setHostKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<SlideDraft[]>([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<'load' | 'save' | 'start' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Anahtar öncelikle linkin fragment'ından gelir; sonra yerel depolamaya kaydedilir ve URL temizlenir
    const fromLink = new URLSearchParams(window.location.hash.slice(1)).get('k');
    if (fromLink) {
      savePresentationKey(id, fromLink);
      window.history.replaceState(null, '', window.location.pathname);
    }
    const key = fromLink ?? getPresentationKey(id);
    setHostKey(key);
    setReady(true);
    if (!key) return;

    setBusy('load');
    api<PresentationDto>(`/presentations/${id}`, { hostKey: key })
      .then((p) => {
        setTitle(p.title);
        setSlides(p.slides.map(fromServer));
      })
      .catch((err) => setError(errorTextFor(t, err)))
      .finally(() => setBusy(null));
    // Yalnızca sayfa açılırken yüklenir; dil değişikliği veriyi yeniden çekmemeli
  }, [id]);

  const save = async (): Promise<boolean> => {
    if (!hostKey) return false;
    // Başlık sonradan da girilebilsin diye kayıtta yalnızca soru ve seçenek kontrol edilir
    const problem = validateDraft(title, slides);
    if (problem && problem !== 'title') {
      setError(t.editor.validation[problem]);
      return false;
    }
    setError(null);
    setBusy('save');
    try {
      await api(`/presentations/${id}/slides`, {
        method: 'PUT',
        body: { slides: slides.map(toPayload) },
        hostKey,
      });
      setSaved(true);
      return true;
    } catch (err) {
      setError(errorTextFor(t, err));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const start = async () => {
    if (!hostKey) return;
    if (slides.length === 0) return setError(t.editor.validation.noSlides);
    if (!(await save())) return;

    setBusy('start');
    try {
      const room = await api<{ code: string }>(`/presentations/${id}/rooms`, { method: 'POST', hostKey });
      saveHostKey(room.code, hostKey);
      router.push(`/present/${room.code}`);
    } catch (err) {
      setError(errorTextFor(t, err));
      setBusy(null);
    }
  };

  if (!ready) return <Notice title={t.editor.loading} />;

  if (!hostKey) {
    return (
      <Notice title={t.errors.forbidden} body={t.editor.needKey}>
        <button type="button" onClick={() => router.push('/create')} className="mt-6 min-h-12 rounded-xl bg-accent px-6 font-bold text-accent-fg">
          {t.editor.newInstead}
        </button>
      </Notice>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-widest text-muted">{t.editor.editTitle}</p>
        <h1 className="text-4xl font-black tracking-tight">{title || '…'}</h1>
        <p className="text-muted">{t.editor.slideCount(slides.length)}</p>
      </header>

      {busy === 'load' ? (
        <p className="animate-pulse text-muted">{t.editor.loading}</p>
      ) : (
        <SlideEditor
          slides={slides}
          onChange={(next) => {
            setSaved(false);
            setSlides(next);
          }}
          disabled={busy !== null}
        />
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-5 py-3 font-medium text-red-500">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur">
        {saved && <span className="mr-auto text-sm font-medium text-success">{t.editor.saved}</span>}
        <button
          type="button"
          onClick={save}
          disabled={busy !== null}
          className="min-h-12 rounded-xl border-2 border-line bg-surface px-6 font-bold disabled:opacity-60"
        >
          {busy === 'save' ? t.editor.saving : t.editor.save}
        </button>
        <button
          type="button"
          onClick={start}
          disabled={busy !== null}
          className="min-h-12 rounded-xl bg-accent px-6 font-bold text-accent-fg shadow-card disabled:opacity-60"
        >
          {busy === 'start' ? t.editor.starting : t.editor.start}
        </button>
      </div>
    </div>
  );
}

function Notice({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {body && <p className="max-w-md text-muted">{body}</p>}
      {children}
    </div>
  );
}
