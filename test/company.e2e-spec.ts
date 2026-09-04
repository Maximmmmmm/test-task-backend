import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, postStaff } from './util/create-test-app.js';

describe('Company (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /company returns the seeded configuration', async () => {
    const response = await request(app.getHttpServer()).get('/company').expect(200);
    expect(response.body.id).toBe(1);
    expect(response.body.name).toBe('Default Company');
    expect(response.body.defaultBaseSalary).toBe(1000);
  });

  it('PATCH /company updates the default base salary', async () => {
    const response = await request(app.getHttpServer())
      .patch('/company')
      .send({ defaultBaseSalary: 1500 })
      .expect(200);
    expect(response.body.defaultBaseSalary).toBe(1500);
  });

  it('staff without an override use the updated company default', async () => {
    const staff = await postStaff(app, {
      name: 'Employee NoOverride',
      joinedAt: '2020-01-01',
      type: 'EMPLOYEE',
    });
    const salary = await request(app.getHttpServer())
      .get(`/staff/${staff.body.id}/salary`)
      .query({ asOf: '2025-01-01' })
      .expect(200);
    // 1500 * (1 + 5 * 0.03) = 1725
    expect(salary.body.salary).toBe(1725);
  });

  it('staff with an override ignore the company default', async () => {
    const staff = await postStaff(app, {
      name: 'Employee Override',
      joinedAt: '2020-01-01',
      type: 'EMPLOYEE',
      baseSalaryOverride: 2000,
    });
    const salary = await request(app.getHttpServer())
      .get(`/staff/${staff.body.id}/salary`)
      .query({ asOf: '2025-01-01' })
      .expect(200);
    // 2000 * (1 + 5 * 0.03) = 2300
    expect(salary.body.salary).toBe(2300);
  });

  it('PATCH /company rejects a negative salary', async () => {
    await request(app.getHttpServer())
      .patch('/company')
      .send({ defaultBaseSalary: -5 })
      .expect(400);
  });

  it('PATCH /company rejects an empty name', async () => {
    await request(app.getHttpServer()).patch('/company').send({ name: '' }).expect(400);
  });
});