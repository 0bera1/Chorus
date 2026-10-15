'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Verilen metin için QR kodu üretir (istemci tarafında, sunucuya yük bindirmeden). */
export function QrCode({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: '#17142a', light: '#ffffff' } })
      .then((url) => active && setSrc(url))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-2xl bg-accent-soft" aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={label} className="rounded-2xl bg-white p-2" />;
}
