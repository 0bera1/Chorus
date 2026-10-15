import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { T } from '@/lib/strings';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${T.brand} — ${T.slogan}`, template: `%s · ${T.brand}` },
  description: T.landing.heroBody,
  applicationName: T.brand,
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0b1a' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {/* Kullanıcı "azaltılmış hareket" tercih ettiyse animasyonlar sadeleşir */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}

