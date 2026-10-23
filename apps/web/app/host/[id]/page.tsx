import type { Metadata } from 'next';
import { HostPresentation } from '@/components/host-presentation';
import { tr } from '@/lib/i18n/dictionaries/tr';

export const metadata: Metadata = { title: tr.editor.editTitle };

export default async function HostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HostPresentation id={id} />;
}
