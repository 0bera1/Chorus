import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as schema from './schema';
import type { Db } from './client';

export const DB = Symbol('DB');
export const DB_POOL = Symbol('DB_POOL');

@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: (): Pool => {
        if (!config.databaseUrl) throw new Error('DATABASE_URL tanımlı değil');
        return new Pool({ connectionString: config.databaseUrl, max: 10 });
      },
    },
    {
      provide: DB,
      inject: [DB_POOL],
      useFactory: (pool: Pool): Db => drizzle(pool, { schema }),
    },
  ],
  exports: [DB, DB_POOL],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
