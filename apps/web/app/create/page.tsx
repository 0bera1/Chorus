import type { Metadata } from 'next';
import { CreatePresentation } from '@/components/create-presentation';
import { tr } from '@/lib/i18n/dictionaries/tr';

export const metadata: Metadata = { title: tr.editor.createTitle };

export default function CreatePage() {
  return <CreatePresentation />;
}
