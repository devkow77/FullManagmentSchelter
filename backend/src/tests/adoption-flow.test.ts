import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import { Gender, Role } from '../generated/prisma/enums';
import {
  type Agent,
  buildAnimalPayload,
  clearDomainData,
  fillAdoptionProfile,
  loginAs,
  SEED_PASSWORD,
} from './testHelpers';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}));

describe('Adopcja happy-path - Testy integracyjne', () => {
  let adminAgent: Agent;
  let userAgent: Agent;
  let animalId: number;
  let adoptionId: number;
  let otherAdoptionId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();
    await fillAdoptionProfile('michal@gmail.com');

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
    const res = await userAgent.post('/api/adoptions').send({
      animalId,
      message: 'Chcę adoptować to zwierzę, mam odpowiednie warunki.',
    });

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.body).toHaveProperty('id');
    adoptionId = res.body.id;
  });

  it('Drugi użytkownik też może złożyć wniosek na to samo zwierzę', async () => {
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    await prisma.user.create({
      data: {
        fullName: 'Anna Nowak',
        email: 'anna@gmail.com',
        password: hashedPassword,
        role: Role.UZYTKOWNIK,
        gender: Gender.KOBIETA,
        isEmailVerified: true,
      },
    });
    await fillAdoptionProfile('anna@gmail.com');

    const otherUserAgent = await loginAs('anna@gmail.com');
    const res = await otherUserAgent.post('/api/adoptions').send({
      animalId,
      message: 'Też chcę adoptować to zwierzę.',
    });

    expect(res.status).toBe(StatusCodes.CREATED);
    otherAdoptionId = res.body.id;
  });

  it('Admin akceptuje wniosek — zaproszenie na spotkanie, nie finalna adopcja', async () => {
    const res = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
      status: 'ZAAKCEPTOWANA',
      employeeNote: 'Warunki wstępne OK — zapraszamy na spotkanie.',
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

  it('Po akceptacji pozostałe oczekujące wnioski są anulowane', async () => {
    const otherAdoption = await prisma.adoption.findUnique({
      where: { id: otherAdoptionId },
    });

    expect(otherAdoption?.status).toBe('ANULOWANA');
    expect(otherAdoption?.employeeNote).toContain(
      'zaakceptowano inny wniosek adopcyjny',
    );
  });

  it('Po spotkaniu admin finalizuje adopcję', async () => {
    const res = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
      status: 'ZAKONCZONA',
      employeeNote: 'Spotkanie przebiegło pomyślnie — adopcja sfinalizowana.',
    });

    expect(res.status).toBe(StatusCodes.OK);

    const adoption = await prisma.adoption.findUnique({
      where: { id: adoptionId },
    });
    expect(adoption?.status).toBe('ZAKONCZONA');

    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    expect(animal?.status).toBe('ADOPTOWANY');
    expect(animal?.cageId).toBeNull();
  });
});
