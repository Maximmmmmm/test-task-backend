import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, patchStaff, postStaff } from './util/create-test-app.js';

describe('Staff (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /staff creates a valid staff member with no supervisor', async () => {
    const response = await postStaff(app, {
      name: 'Alice',
      joinedAt: '2020-01-15',
      type: 'EMPLOYEE',
    });
    expect(response.status).toBe(201);
    expect(response.body.id).toBeGreaterThan(0);
    expect(response.body.name).toBe('Alice');
    expect(response.body.joinedAt).toBe('2020-01-15');
    expect(response.body.type).toBe('EMPLOYEE');
    expect(response.body.supervisorId).toBeNull();
    expect(response.body.baseSalaryOverride).toBeNull();
  });

  it('POST /staff rejects an invalid type', async () => {
    const response = await postStaff(app, {
      name: 'Bob',
      joinedAt: '2020-01-15',
      type: 'BOSS',
    });
    expect(response.status).toBe(400);
  });

  it('POST /staff rejects a malformed joinedAt', async () => {
    const response = await postStaff(app, {
      name: 'Bob',
      joinedAt: '20/01/2020',
      type: 'EMPLOYEE',
    });
    expect(response.status).toBe(400);
  });

  it('POST /staff rejects non-whitelisted fields', async () => {
    const response = await postStaff(app, {
      name: 'Bob',
      joinedAt: '2020-01-15',
      type: 'EMPLOYEE',
      salary: 9999,
    });
    expect(response.status).toBe(400);
  });

  it('an Employee cannot have subordinates', async () => {
    const employee = await postStaff(app, {
      name: 'Carol',
      joinedAt: '2020-01-15',
      type: 'EMPLOYEE',
    });
    const response = await postStaff(app, {
      name: 'Dave',
      joinedAt: '2020-01-15',
      type: 'MANAGER',
      supervisorId: employee.body.id,
    });
    expect(response.status).toBe(409);
  });

  it('self-supervision is rejected', async () => {
    const created = await postStaff(app, {
      name: 'Erin',
      joinedAt: '2020-01-15',
      type: 'MANAGER',
    });
    const response = await patchStaff(app, created.body.id, {
      supervisorId: created.body.id,
    });
    expect(response.status).toBe(409);
  });

  it('a cyclic supervisor change is rejected', async () => {
    const managerA = await postStaff(app, {
      name: 'Frank',
      joinedAt: '2020-01-15',
      type: 'MANAGER',
    });
    const managerB = await postStaff(app, {
      name: 'Grace',
      joinedAt: '2020-01-15',
      type: 'MANAGER',
      supervisorId: managerA.body.id,
    });

    const response = await patchStaff(app, managerA.body.id, {
      supervisorId: managerB.body.id,
    });
    expect(response.status).toBe(409);
  });

  it('GET /staff/:id returns the created staff member', async () => {
    const created = await postStaff(app, {
      name: 'Hank',
      joinedAt: '2020-01-15',
      type: 'SALES',
    });
    const response = await request(app.getHttpServer())
      .get(`/staff/${created.body.id}`)
      .expect(200);
    expect(response.body.name).toBe('Hank');
    expect(response.body.type).toBe('SALES');
  });

  it('GET /staff/:id returns 404 for an unknown staff member', async () => {
    await request(app.getHttpServer()).get('/staff/999999').expect(404);
  });

  it('DELETE /staff/:id removes the staff member', async () => {
    const created = await postStaff(app, {
      name: 'Iris',
      joinedAt: '2020-01-15',
      type: 'EMPLOYEE',
    });
    await request(app.getHttpServer()).delete(`/staff/${created.body.id}`).expect(200);
    await request(app.getHttpServer()).get(`/staff/${created.body.id}`).expect(404);
  });
});