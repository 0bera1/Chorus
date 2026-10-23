import type { Metadata } from 'next';
import { ParticipantView } from '@/components/participant-view';
import { tr } from '@/lib/i18n/dictionaries/tr';

export const metadata: Metadata = { title: tr.join.title };

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ParticipantView code={code.toUpperCase()} />;
}
