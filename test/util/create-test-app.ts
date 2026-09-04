import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

/**
 * Boots the real Nest application exactly like production (`main.ts`):
 * global ValidationPipe + Swagger via `configureApp`, backed by an isolated
 * in-memory SQLite database (`:memory:`).
 */
export async function createTestApp(): Promise<INestApplication> {
  process.env.DB_PATH = ':memory:';
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export function postStaff(
  app: INestApplication,
  body: Record<string, unknown>,
): ReturnType<typeof request> {
  return request(app.getHttpServer()).post('/staff').send(body);
}

export function patchStaff(
  app: INestApplication,
  id: number,
  body: Record<string, unknown>,
): ReturnType<typeof request> {
  return request(app.getHttpServer()).patch(`/staff/${id}`).send(body);
}