import type { Metadata } from 'next';
import { DemoLanding } from '@/components/demo-landing';
import { tr } from '@/lib/i18n/dictionaries/tr';

export const metadata: Metadata = { title: tr.demo.title };

export default function DemoPage() {
  return <DemoLanding />;
}
