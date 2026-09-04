import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, postStaff } from './util/create-test-app.js';

const AS_OF = '2025-01-01';
const JOINED = '2020-01-01';

describe('Salary (e2e)', () => {
  let app: INestApplication;
  let ids: Record<string, number>;

  beforeAll(async () => {
    app = await createTestApp();

    ids = {};
    const a = await postStaff(app, { name: 'A', joinedAt: JOINED, type: 'MANAGER' });
    ids.a = a.body.id;
    const b = await postStaff(app, {
      name: 'B',
      joinedAt: JOINED,
      type: 'EMPLOYEE',
      supervisorId: ids.a,
    });
    ids.b = b.body.id;
    const c = await postStaff(app, {
      name: 'C',
      joinedAt: JOINED,
      type: 'SALES',
      supervisorId: ids.a,
    });
    ids.c = c.body.id;
    const d = await postStaff(app, {
      name: 'D',
      joinedAt: JOINED,
      type: 'EMPLOYEE',
      supervisorId: ids.c,
    });
    ids.d = d.body.id;
    const e = await postStaff(app, {
      name: 'E',
      joinedAt: JOINED,
      type: 'MANAGER',
      supervisorId: ids.a,
    });
    ids.e = e.body.id;
    const f = await postStaff(app, {
      name: 'F',
      joinedAt: JOINED,
      type: 'EMPLOYEE',
      supervisorId: ids.e,
    });
    ids.f = f.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('calculates a leaf Employee salary (B = 1150)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/staff/${ids.b}/salary`)
      .query({ asOf: AS_OF })
      .expect(200);
    expect(response.body.salary).toBe(1150);
    expect(response.body.asOf).toBe(AS_OF);
  });

  it('calculates a nested Sales salary using all descendants (C = 1053.45)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/staff/${ids.c}/salary`)
      .query({ asOf: AS_OF })
      .expect(200);
    expect(response.body.salary).toBeCloseTo(1053.45, 5);
  });

  it('calculates a root Manager salary (A = 1267.30)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/staff/${ids.a}/salary`)
      .query({ asOf: AS_OF })
      .expect(200);
    expect(response.body.salary).toBeCloseTo(1267.3, 5);
  });

  it('calculates the company total salary exactly once per member (7026.50)', async () => {
    const response = await request(app.getHttpServer())
      .get('/company/total-salary')
      .query({ asOf: AS_OF })
      .expect(200);
    expect(response.body.totalSalary).toBeCloseTo(7026.5, 5);
  });

  it('is deterministic across repeated requests', async () => {
    const first = await request(app.getHttpServer())
      .get(`/staff/${ids.a}/salary`)
      .query({ asOf: AS_OF });
    const second = await request(app.getHttpServer())
      .get(`/staff/${ids.a}/salary`)
      .query({ asOf: AS_OF });
    expect(first.body.salary).toBe(second.body.salary);
  });

  it('returns 404 for an unknown staff member salary', async () => {
    await request(app.getHttpServer())
      .get('/staff/999999/salary')
      .query({ asOf: AS_OF })
      .expect(404);
  });

  it('returns 400 for a malformed asOf', async () => {
    await request(app.getHttpServer())
      .get(`/staff/${ids.b}/salary`)
      .query({ asOf: '2025/01/01' })
      .expect(400);
  });

  it('returns 400 when asOf is missing', async () => {
    await request(app.getHttpServer()).get(`/staff/${ids.b}/salary`).expect(400);
  });

  it('returns 400 when asOf is earlier than joinedAt', async () => {
    await request(app.getHttpServer())
      .get(`/staff/${ids.b}/salary`)
      .query({ asOf: '2019-12-31' })
      .expect(400);
  });
});