import request from 'supertest';
import { expect } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';

export type Agent = ReturnType<typeof request.agent>;

export const SEED_PASSWORD = 'Haslo12345.';

export const loginAs = async (email: string, password = SEED_PASSWORD) => {
  const agent = request.agent(app);
  const loginRes = await agent.post('/api/auth/login').send({ email, password });
  expect(loginRes.status).toBe(StatusCodes.OK);
  return agent;
};

export const toLocalDateInputValue = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const yearsAgoIso = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString();
};

/** Uzupełnia dane osobowe wymagane do złożenia wniosku adopcyjnego. */
export const fillAdoptionProfile = async (email: string) => {
  await prisma.user.update({
    where: { email },
    data: {
      phoneNumber: '123456789',
      city: 'Rzeszów',
      postalCode: '35-001',
      street: 'ul. Testowa 1',
      dateOfBirth: new Date('1995-05-15T00:00:00.000Z'),
      gender: 'MEZCZYZNA',
      housingType: 'DOM',
      hasGardenOrBalcony: true,
      livingConditions:
        'Dom z ogrodem, doświadczenie z psami średniej wielkości.',
      isFormFilled: true,
    },
  });
};

export const buildAnimalPayload = (
  overrides: Record<string, unknown> = {},
) => ({
  name: 'Burek',
  type: 'PIES',
  gender: 'SAMIEC',
  size: 'SREDNI',
  breed: 'Mieszaniec',
  energyLevel: 'SREDNI',
  traits: 'Przyjacielski, głośny',
  dateOfBirth: yearsAgoIso(3),
  description: 'Znaleziony przy drodze krajowej, spokojny i ufny.',
  status: 'SZUKA_DOMU',
  healthStatus: 'ZDROWY',
  nextVisitDate: null,
  foundAt: new Date('2026-01-15T12:00:00.000Z').toISOString(),
  foundLocation: 'Rzeszów',
  imageUrl: ['https://example.com/burek.jpg'],
  isSterilized: true,
  isVaccinated: true,
  isChildFriendly: false,
  isTrained: false,
  lovesPlay: true,
  lovesWalks: true,
  acceptsDogs: true,
  acceptsCats: false,
  lovesAffection: true,
  poorlyToleratesShelter: false,
  ...overrides,
});

/** Czyści dane zależne od użytkowników / zwierząt przed seedem w testach. */
export const clearDomainData = async () => {
  await prisma.animalNeed.deleteMany({});
  await prisma.animalDailyCare.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.adoption.deleteMany({});
  await prisma.dailyZoneAssignment.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.cage.deleteMany({});
  await prisma.vet.deleteMany({});
};
