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

describe('Adopcja happy-path - Testy integracyjne', () => {
  let adminAgent: Agent;
  let userAgent: Agent;
  let animalId: number;
  let adoptionId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@gmail.com');
    userAgent = await loginAs('michal@gmail.com');

    const cage = await prisma.cage.create({ data: { zone: 'A', number: 1 } });
    const animalRes = await adminAgent.post('/api/animals').send(
      buildAnimalPayload({
        cageId: cage.id,
        status: 'SZUKA_DOMU',
        name: 'AdoptujMnie',
      }),
    );
    expect(animalRes.status).toBe(StatusCodes.CREATED);
    animalId = animalRes.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Użytkownik składa wniosek adopcyjny', async () => {
    // Sprawdza utworzenie wniosku OCZEKUJACA dla zwierzęcia SZUKA_DOMU.
    const res = await userAgent.post('/api/adoptions').send({
      animalId,
      message: 'Chcę adoptować to zwierzę, mam odpowiednie warunki.',
    });

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.body).toHaveProperty('id');
    adoptionId = res.body.id;
  });

  it('Admin akceptuje wniosek i zwierzę przechodzi w W_TRAKCIE_ADOPCJI', async () => {
    // Sprawdza akceptację wniosku oraz efekt uboczny na status zwierzęcia.
    const res = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
      status: 'ZAAKCEPTOWANA',
      employeeNote: 'Warunki mieszkaniowe i doświadczenie są wystarczające.',
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe('Adopcja została zaktualizowana!');

    const adoption = await prisma.adoption.findUnique({
      where: { id: adoptionId },
    });
    expect(adoption?.status).toBe('ZAAKCEPTOWANA');

    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    expect(animal?.status).toBe('W_TRAKCIE_ADOPCJI');
  });
});
