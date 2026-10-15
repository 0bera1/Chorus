import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { createDb } from './client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL tanımlı değil');
  const { db, pool } = createDb(url);
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  await pool.end();
  console.log('Migration tamamlandı');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
