import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Tarayıcılar varsayılan olarak /favicon.ico ister. Chorus favicon'u SVG olduğundan
 * aynı logoyu bu yolda da sunarız; böylece 404 hatası oluşmaz.
 */
export async function GET() {
  const svg = await readFile(path.join(process.cwd(), 'app', 'icon.svg'), 'utf8');
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400',
    },
  });
}
