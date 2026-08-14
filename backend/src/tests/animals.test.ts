import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app';
import prisma from '../prisma';
import { StatusCodes } from 'http-status-codes';
import usersSeed from '../../prisma/seed/usersSeed';
import type { Agent } from './testHelpers';

const loginAs = async (email: string, password = 'Haslo12345.') => {
  const agent = request.agent(app);
  const loginRes = await agent.post('/api/auth/login').send({ email, password });
  expect(loginRes.status).toBe(StatusCodes.OK);
  return agent;
};

const yearsAgoIso = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString();
};

const buildAnimalPayload = (
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
  status: 'ZNALEZIONY',
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

describe('Animal CRUD - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;

  let freeCageId: number;
  let secondCageId: number;
  let createdAnimalId: number;

  beforeAll(async () => {
    await usersSeed();

    await prisma.animalNeed.deleteMany({});
    await prisma.animalDailyCare.deleteMany({});
    await prisma.medicalRecord.deleteMany({});
    await prisma.adoption.deleteMany({});
    await prisma.animal.deleteMany({});
    await prisma.cage.deleteMany({});

    const [cageA, cageB] = await Promise.all([
      prisma.cage.create({ data: { zone: 'A', number: 1 } }),
      prisma.cage.create({ data: { zone: 'A', number: 2 } }),
    ]);
    freeCageId = cageA.id;
    secondCageId = cageB.id;

    adminAgent = await loginAs('admin@example.com');
    workerAgent = await loginAs('pracownik@example.com');
    userAgent = await loginAs('michal@example.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/animals', () => {
    it('Odmawia utworzenia zwierzęcia bez autoryzacji', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent
        .post('/api/animals')
        .send(buildAnimalPayload({ cageId: freeCageId }));

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(res.body.msg).toBe('Brak tokenu, autoryzacja odmówiona!');
    });

    it('Poprawne utworzenie nowego zwierzęcia przez pracownika', async () => {
      // Sprawdza, że pracownik może rejestrować zwierzęta.
      const res = await workerAgent
        .post('/api/animals')
        .send(
          buildAnimalPayload({
            name: 'Azor',
            cageId: secondCageId,
            description: 'Zwierzę zarejestrowane przez pracownika.',
          }),
        );

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Azor');
      expect(res.body.cageId).toBe(secondCageId);

      const cleanup = await workerAgent.delete(`/api/animals/${res.body.id}`);
      expect(cleanup.status).toBe(StatusCodes.OK);
    });

    it('Odmawia utworzenia zwierzęcia zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent
        .post('/api/animals')
        .send(buildAnimalPayload({ cageId: freeCageId }));

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Brak uprawnień!');
    });

    it('Poprawne utworzenie nowego zwierzęcia przez admina', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const res = await adminAgent
        .post('/api/animals')
        .send(buildAnimalPayload({ cageId: freeCageId }));

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Burek');
      expect(res.body.cageId).toBe(freeCageId);
      expect(res.body.healthStatus).toBe('ZDROWY');

      createdAnimalId = res.body.id;
    });

    it('Zwraca CONFLICT gdy wybrana klatka jest już zajęta', async () => {
      // Sprawdza konflikt danych / duplikat (409).
      const res = await adminAgent
        .post('/api/animals')
        .send(
          buildAnimalPayload({
            name: 'Reksio',
            cageId: freeCageId,
            description: 'Drugi pies próbujący zająć tę samą klatkę.',
          }),
        );

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe('Wybrana klatka jest już zajęta!');
    });

    it('Zwraca NOT_FOUND gdy klatka nie istnieje', async () => {
      // Sprawdza błąd przy nieistniejącej klatce (404).
      const res = await adminAgent
        .post('/api/animals')
        .send(buildAnimalPayload({ cageId: 999999 }));

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Klatka nie istnieje!');
    });

    it('Zwraca błąd walidacji przy niepoprawnych danych', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/animals').send({
        name: '',
        cageId: secondCageId,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidlowy format danych!');
      expect(res.body).toHaveProperty('errors');
    });

    it('Zwraca CONFLICT gdy data znalezienia jest z przyszłości', async () => {
      // Sprawdza konflikt danych / duplikat (409).
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await adminAgent.post('/api/animals').send(
        buildAnimalPayload({
          name: 'Futrzak',
          cageId: secondCageId,
          foundAt: tomorrow.toISOString(),
          description: 'Opis zwierzęcia z datą znalezienia z przyszłości.',
        }),
      );

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe(
        'Data znalezienia zwierzecia jest nieprawidlowa!',
      );
    });
  });

  describe('GET /api/animals', () => {
    it('Pobranie listy wszystkich zwierząt', async () => {
      // Sprawdza poprawne pobranie listy zwierząt bez paginacji.
      const res = await publicAgent.get('/api/animals');

      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((a: { id: number }) => a.id === createdAnimalId)).toBe(
        true,
      );
    });

    it('Pobranie listy zwierząt z paginacją', async () => {
      // Sprawdza odpowiedź z paginacją (data, total, page).
      const res = await publicAgent.get('/api/animals?page=1&limit=10');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body.page).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('GET /api/animals/:id', () => {
    it('Poprawne pobranie jednego zwierzęcia po ID', async () => {
      // Sprawdza poprawne pobranie jednego zwierzęcia po ID.
      const res = await publicAgent.get(`/api/animals/${createdAnimalId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(createdAnimalId);
      expect(res.body.name).toBe('Burek');
    });

    it('Zwraca 400 przy ID, które nie jest liczbą', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await publicAgent.get('/api/animals/nie-liczba');

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidlowe ID zwierzecia!');
    });

    it('Zwraca 404, gdy zwierzę nie istnieje', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await publicAgent.get('/api/animals/999999');

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Nie ma zwierzecia z takim id!');
    });
  });

  describe('PATCH /api/animals/:id', () => {
    it('Poprawna aktualizacja danych zwierzęcia przez pracownika', async () => {
      // Sprawdza, że pracownik może aktualizować dane zwierzęcia.
      const res = await workerAgent
        .patch(`/api/animals/${createdAnimalId}`)
        .send(
          buildAnimalPayload({
            cageId: freeCageId,
            name: 'Burek Pracownik',
            description: 'Zaktualizowany opis przez pracownika schroniska.',
          }),
        );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.name).toBe('Burek Pracownik');
    });

    it('Poprawna aktualizacja danych zwierzęcia przez admina', async () => {
      // Sprawdza poprawną aktualizację rekordu.
      const res = await adminAgent
        .patch(`/api/animals/${createdAnimalId}`)
        .send(
          buildAnimalPayload({
            name: 'Burek Zmieniony',
            size: 'DUZY',
            status: 'SZUKA_DOMU',
            traits: 'Spokojny, ułożony',
            description: 'Zaktualizowany opis zwierzęcia w schronisku.',
            foundLocation: 'Rzeszów - Centrum',
            cageId: freeCageId,
          }),
        );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.name).toBe('Burek Zmieniony');
      expect(res.body.size).toBe('DUZY');
      expect(res.body.status).toBe('SZUKA_DOMU');
    });

    it('Zwraca 400 przy nieprawidłowym formacie ID', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent
        .patch('/api/animals/brak-id')
        .send(buildAnimalPayload({ cageId: secondCageId }));

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidlowe ID zwierzecia!');
    });

    it('Zwraca 400 przy niepoprawnym formacie danych w body', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent
        .patch(`/api/animals/${createdAnimalId}`)
        .send({ name: '' });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidlowy format danych!');
    });

    it('Zwraca 404 podczas edycji nieistniejącego zwierzęcia', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent
        .patch('/api/animals/999999')
        .send(buildAnimalPayload({ cageId: secondCageId, name: 'Felix' }));

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Zwierze nie istnieje!');
    });

    it('Zwraca CONFLICT gdy data znalezienia jest z przyszłości', async () => {
      // Sprawdza konflikt danych / duplikat (409).
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await adminAgent
        .patch(`/api/animals/${createdAnimalId}`)
        .send(
          buildAnimalPayload({
            cageId: freeCageId,
            foundAt: tomorrow.toISOString(),
          }),
        );

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe(
        'Data znalezienia zwierzecia jest nieprawidlowa!',
      );
    });
  });

  describe('GET /api/animals/daily-care/status', () => {
    it('Odmawia dostępu bez autoryzacji', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.get('/api/animals/daily-care/status');

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Zwraca status codziennej opieki dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/animals/daily-care/status');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('allComplete');
      expect(typeof res.body.allComplete).toBe('boolean');
      expect(res.body.allComplete).toBe(false);
    });
  });

  describe('GET /api/animals/needs/status', () => {
    it('Zwraca status zapotrzebowań dla admina', async () => {
      // Sprawdza, że status zapotrzebowań odzwierciedla aktywne potrzeby.
      const res = await adminAgent.get('/api/animals/needs/status');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('hasActiveNeeds');
      expect(res.body).toHaveProperty('activeNeedsCount');
      expect(res.body.hasActiveNeeds).toBe(false);
      expect(res.body.activeNeedsCount).toBe(0);
    });
  });

  describe('GET /api/animals/daily-care/workers-progress', () => {
    it('Zwraca postęp pracowników dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/animals/daily-care/workers-progress');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('workers');
      expect(Array.isArray(res.body.workers)).toBe(true);
    });
  });

  describe('GET /api/animals/daily-care/my-tasks', () => {
    it('Odmawia administratorowi', async () => {
      const res = await adminAgent.get('/api/animals/daily-care/my-tasks');

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Brak uprawnień!');
    });

    it('Zwraca puste zadania gdy pracownik nie ma strefy na dziś', async () => {
      const res = await workerAgent.get('/api/animals/daily-care/my-tasks');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
      expect(res.body.zones).toEqual([]);
    });

    it('Zwraca zwierzęta z przypisanej strefy pracownika', async () => {
      const { start } = (
        await import('../utils/animalHelpers')
      ).getTodayRange();

      await prisma.dailyZoneAssignment.create({
        data: {
          workerId: (await prisma.user.findUnique({
            where: { email: 'pracownik@example.com' },
            select: { id: true },
          }))!.id,
          zone: 'A',
          date: start,
        },
      });

      const res = await workerAgent.get('/api/animals/daily-care/my-tasks');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.zones).toContain('A');
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.some((animal: { id: number }) => animal.id === createdAnimalId),
      ).toBe(true);

      await prisma.dailyZoneAssignment.deleteMany({
        where: { zone: 'A', date: start },
      });
    });
  });

  describe('PATCH /api/animals/:id/daily-care', () => {
    it('Odmawia adminowi (tylko pracownik)', async () => {
      // Sprawdza, że administrator nie ma dostępu do tej operacji (403).
      const res = await adminAgent
        .patch(`/api/animals/${createdAnimalId}/daily-care`)
        .send({ field: 'fed', value: true });

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Odmawia przy niepoprawnych danych', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await workerAgent
        .patch(`/api/animals/${createdAnimalId}/daily-care`)
        .send({ field: 'sleep', value: true });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toContain('Nieprawidlowe dane');
    });

    it('Odmawia pracownikowi bez przypisanej strefy', async () => {
      const res = await workerAgent
        .patch(`/api/animals/${createdAnimalId}/daily-care`)
        .send({ field: 'fed', value: true });

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toContain('przypisanej');
    });

    it('Pozwala pracownikowi odznaczyć karmienie w przypisanej strefie', async () => {
      const worker = await prisma.user.findUniqueOrThrow({
        where: { email: 'pracownik@example.com' },
        select: { id: true },
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyZoneAssignment.create({
        data: {
          date: today,
          zone: 'A',
          workerId: worker.id,
        },
      });

      const res = await workerAgent
        .patch(`/api/animals/${createdAnimalId}/daily-care`)
        .send({ field: 'fed', value: true });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.fed).toBe(true);
    });
  });

  describe('DELETE /api/animals/:id', () => {
    it('Poprawne usunięcie zwierzęcia przez pracownika', async () => {
      // Sprawdza, że pracownik może usuwać zwierzęta.
      const createRes = await workerAgent
        .post('/api/animals')
        .send(
          buildAnimalPayload({
            name: 'DoUsuniecia',
            cageId: secondCageId,
            description: 'Zwierzę tymczasowe do usunięcia przez pracownika.',
          }),
        );
      expect(createRes.status).toBe(StatusCodes.CREATED);

      const res = await workerAgent.delete(`/api/animals/${createRes.body.id}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyslnie usunieto zwierze!');
    });

    it('Zwraca 400 przy niepoprawnym formacie ID', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.delete('/api/animals/bledne-id');

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidlowe ID zwierzecia!');
    });

    it('Zwraca 404 przy usuwaniu nieistniejącego rekordu', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.delete('/api/animals/999999');

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Zwierze nie istnieje!');
    });

    it('Poprawne usunięcie zwierzęcia przez admina', async () => {
      // Sprawdza poprawne usunięcie rekordu.
      const res = await adminAgent.delete(`/api/animals/${createdAnimalId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyslnie usunieto zwierze!');

      const checkDb = await prisma.animal.findUnique({
        where: { id: createdAnimalId },
      });
      expect(checkDb).toBeNull();
    });
  });
});
