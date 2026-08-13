import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import {
  buildAnimalPayload,
  clearDomainData,
  fillAdoptionProfile,
  loginAs,
  type Agent,
} from './testHelpers';
import { expireAcceptedAdoptions } from '../jobs/adoptionExpiry.job';
import { StatusCodes } from 'http-status-codes';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}));

describe('Wygasanie zaakceptowanych wniosków adopcyjnych', () => {
  let adminAgent: Agent;
  let userAgent: Agent;
  let animalId: number;
  let adoptionId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();
    await fillAdoptionProfile('michal@example.com');

    adminAgent = await loginAs('admin@example.com');
    userAgent = await loginAs('michal@example.com');

    const cage = await prisma.cage.create({ data: { zone: 'A', number: 1 } });
    const animalRes = await adminAgent
      .post('/api/animals')
      .send(buildAnimalPayload({ cageId: cage.id, status: 'SZUKA_DOMU' }));
    expect(animalRes.status).toBe(StatusCodes.CREATED);
    animalId = animalRes.body.id;

    const adoptionRes = await userAgent.post('/api/adoptions').send({
      animalId,
      message: 'Chcę adoptować',
    });
    expect(adoptionRes.status).toBe(StatusCodes.CREATED);
    adoptionId = adoptionRes.body.id;

    const acceptRes = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
      status: 'ZAAKCEPTOWANA',
      employeeNote: 'Zapraszamy na spotkanie.',
    });
    expect(acceptRes.status).toBe(StatusCodes.OK);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Nie anuluje wniosku przed upływem 7 dni', async () => {
    const count = await expireAcceptedAdoptions();
    expect(count).toBe(0);

    const adoption = await prisma.adoption.findUnique({
      where: { id: adoptionId },
      select: { status: true },
    });
    expect(adoption?.status).toBe('ZAAKCEPTOWANA');
  });

  it('Po upływie 7 dni anuluje wniosek i wraca zwierzę do SZUKA_DOMU', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 8);

    await prisma.adoption.update({
      where: { id: adoptionId },
      data: { acceptedAt: expiredDate },
    });

    const count = await expireAcceptedAdoptions();
    expect(count).toBe(1);

    const adoption = await prisma.adoption.findUnique({
      where: { id: adoptionId },
      select: { status: true, employeeNote: true },
    });
    expect(adoption?.status).toBe('ANULOWANA');
    expect(adoption?.employeeNote).toContain('7-dniowy termin');

    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: { status: true },
    });
    expect(animal?.status).toBe('SZUKA_DOMU');
  });
});
