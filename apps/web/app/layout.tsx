import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import { LocaleProvider } from '@/lib/i18n/locale-context';
import { tr } from '@/lib/i18n/dictionaries/tr';
import { ThemeProvider, themeInitScript } from '@/lib/theme-context';
import './globals.css';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: { default: `${tr.brand} — ${tr.slogan}`, template: `%s · ${tr.brand}` },
  description: tr.landing.heroBody,
  applicationName: tr.brand,
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1210' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={manrope.variable}>
      <body>
        {/* Tema, boyamadan önce uygulanır; böylece yanlış temanın kısa süre görünmesi engellenir */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <LocaleProvider>
          <ThemeProvider>
            {/* Kullanıcı "azaltılmış hareket" tercih ettiyse animasyonlar sadeleşir */}
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
