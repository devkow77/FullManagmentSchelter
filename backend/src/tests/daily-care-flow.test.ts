import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import {
  type Agent,
  buildAnimalPayload,
  clearDomainData,
  loginAs,
} from './testHelpers';

describe('Dzienna opieka E2E - Testy integracyjne', () => {
  let adminAgent: Agent;
  let workerAgent: Agent;
  let animalId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@gmail.com');
    workerAgent = await loginAs('pracownik@gmail.com');

    const cage = await prisma.cage.create({ data: { zone: 'A', number: 1 } });
    const animalRes = await adminAgent.post('/api/animals').send(
      buildAnimalPayload({
        cageId: cage.id,
        status: 'SZUKA_DOMU',
        name: 'OpiekunTest',
      }),
    );
    expect(animalRes.status).toBe(StatusCodes.CREATED);
    animalId = animalRes.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Na starcie daily-care/status zwraca allComplete=false', async () => {
    // Sprawdza, że nieobsłużone zwierzęta oznaczają niekompletny dzień.
    const res = await adminAgent.get('/api/animals/daily-care/status');

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.allComplete).toBe(false);
  });

  it('Pracownik odznacza karmienie, wodę i sprzątanie', async () => {
    // Sprawdza pełny cykl dziennej opieki (fed + watered + cleaned).
    for (const field of ['fed', 'watered', 'cleaned'] as const) {
      const res = await workerAgent
        .patch(`/api/animals/${animalId}/daily-care`)
        .send({ field, value: true });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body[field]).toBe(true);
    }
  });

  it('Po pełnej opiece daily-care/status zwraca allComplete=true', async () => {
    // Sprawdza, że kompletna obsługa wszystkich zwierząt zamyka dzień.
    const res = await adminAgent.get('/api/animals/daily-care/status');

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.allComplete).toBe(true);
  });

  it('Workers-progress zwraca listę pracowników', async () => {
    // Sprawdza kształt odpowiedzi postępu pracowników.
    const res = await adminAgent.get('/api/animals/daily-care/workers-progress');

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body).toHaveProperty('workers');
    expect(Array.isArray(res.body.workers)).toBe(true);
  });
});
