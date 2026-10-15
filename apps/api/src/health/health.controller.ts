import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Db } from '../db/client';

const MB = 1024 * 1024;

@Controller('health')
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Sağlık kontrolü. Yük testi için bellek ve CPU süresi de döner
   * (CPU süresi toplam kullanılan işlemci saniyesidir; iki ölçüm arasındaki fark tüketimi verir).
   */
  @Get()
  async check() {
    let database = 'up';
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      database = 'down';
    }

    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
      memory: { rssMb: round(mem.rss / MB), heapUsedMb: round(mem.heapUsed / MB) },
      cpuSeconds: round((cpu.user + cpu.system) / 1e6, 3),
    };
  }
}

function round(value: number, digits = 1) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
