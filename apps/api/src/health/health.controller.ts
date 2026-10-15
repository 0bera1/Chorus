import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Inject } from '@nestjs/common';
import { DB } from '../db/db.module';
import type { Db } from '../db/client';

@Controller('health')
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get()
  async check() {
    let database = 'up';
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      database = 'down';
    }
    return { status: database === 'up' ? 'ok' : 'degraded', database, uptime: Math.round(process.uptime()) };
  }
}
