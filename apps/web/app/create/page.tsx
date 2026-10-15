import type { Metadata } from 'next';
import { CreatePresentation } from '@/components/create-presentation';
import { T } from '@/lib/strings';

export const metadata: Metadata = { title: T.editor.createTitle };

export default function CreatePage() {
  return <CreatePresentation />;
}
