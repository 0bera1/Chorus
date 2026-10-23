import type { Metadata } from 'next';
import { PresentView } from '@/components/present-view';
import { tr } from '@/lib/i18n/dictionaries/tr';

export const metadata: Metadata = { title: tr.present.roomCode };

export default async function PresentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PresentView code={code.toUpperCase()} />;
}
