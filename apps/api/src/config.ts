/** Ortam değişkenlerinden okunan uygulama ayarları. */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  tokenSecret: process.env.TOKEN_SECRET ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  roomIdleHours: Number(process.env.ROOM_IDLE_HOURS ?? 6),
  roomMaxParticipants: Number(process.env.ROOM_MAX_PARTICIPANTS ?? 500),
};
