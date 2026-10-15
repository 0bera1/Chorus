import type { Metadata } from 'next';
import { HostPresentation } from '@/components/host-presentation';
import { T } from '@/lib/strings';

export const metadata: Metadata = { title: T.editor.editTitle };

export default async function HostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HostPresentation id={id} />;
}
