import 'dotenv/config';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from './config';
import { HttpErrorFilter } from './common/http-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.corsOrigins });
  app.useGlobalFilters(new HttpErrorFilter());
  app.enableShutdownHooks();
  await app.listen(config.port);
  Logger.log(`Chorus API ${config.port} portunda çalışıyor`, 'Bootstrap');
}

bootstrap();
