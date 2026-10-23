'use client';

import { useState, type ComponentType } from 'react';
import { CloseIcon, MicIcon, PhoneIcon, PlayIcon } from '../icons';
import { useT } from '@/lib/i18n/locale-context';
import { buildParticipantScenes } from './participant-scenes';
import { buildPresenterScenes } from './presenter-scenes';
import { TourStage, type TourRole } from './tour-stage';

type Mode = 'closed' | 'choose' | TourRole;

/** "Öğret" düğmesi: önce rolü sorar (sunumu yapan / dinleyen), sonra o rolün sahnesini oynatır. */
export function TourLauncher() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('closed');

  return (
    <>
      <button
        type="button"
        onClick={() => setMode('choose')}
        className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line bg-surface px-6 py-3 font-bold"
      >
        <PlayIcon size={16} /> {t.tour.open}
      </button>

      {mode === 'choose' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-choose-title"
        >
          <div className="flex w-full max-w-lg flex-col gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 id="tour-choose-title" className="text-2xl font-extrabold tracking-tight">
                  {t.tour.chooseTitle}
                </h2>
                <p className="text-muted">{t.tour.chooseBody}</p>
              </div>
              <button
                type="button"
                onClick={() => setMode('closed')}
                aria-label={t.tour.close}
                className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-fg"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <RoleCard Icon={MicIcon} title={t.tour.presenterRole.title} body={t.tour.presenterRole.body} onClick={() => setMode('presenter')} />
              <RoleCard Icon={PhoneIcon} title={t.tour.participantRole.title} body={t.tour.participantRole.body} onClick={() => setMode('participant')} />
            </div>
          </div>
        </div>
      )}

      {(mode === 'presenter' || mode === 'participant') && (
        <TourStage
          role={mode}
          scenes={mode === 'presenter' ? buildPresenterScenes(t) : buildParticipantScenes(t)}
          onClose={() => setMode('closed')}
          onBack={() => setMode('choose')}
        />
      )}
    </>
  );
}

function RoleCard({ Icon, title, body, onClick }: { Icon: ComponentType<{ size?: number }>; title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-4 rounded-2xl border border-line bg-bg p-5 text-left transition hover:border-accent hover:shadow-card"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-fg">
        <Icon size={24} />
      </span>
      <span className="text-lg font-extrabold">{title}</span>
      <span className="text-sm text-muted">{body}</span>
    </button>
  );
}
