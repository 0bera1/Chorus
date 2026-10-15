import type { Metadata } from 'next';
import { ParticipantView } from '@/components/participant-view';
import { T } from '@/lib/strings';

export const metadata: Metadata = { title: T.join.title };

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ParticipantView code={code.toUpperCase()} />;
}
