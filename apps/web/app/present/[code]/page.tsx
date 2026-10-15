import type { Metadata } from 'next';
import { PresentView } from '@/components/present-view';
import { T } from '@/lib/strings';

export const metadata: Metadata = { title: T.present.roomCode };

export default async function PresentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PresentView code={code.toUpperCase()} />;
}
