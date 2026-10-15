import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chorus/shared'],
  // Docker imajı için bağımsız çıktı; izleme kökü monorepo kökü olmalı
  output: 'standalone',
  outputFileTracingRoot: path.join(here, '../../'),
};

export default nextConfig;
