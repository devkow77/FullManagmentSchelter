import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import {
  type Agent,
  buildAnimalPayload,
  clearDomainData,
  fillAdoptionProfile,
  loginAs,
} from './testHelpers';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}));

describe('Adopcje - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;

  let animalId: number;
  let nonAdoptableAnimalId: number;
  let adoptionId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();
    await fillAdoptionProfile('michal@gmail.com');

    adminAgent = await loginAs('admin@gmail.com');
    workerAgent = await loginAs('pracownik@gmail.com');
    userAgent = await loginAs('michal@gmail.com');

    const [cageA, cageB] = await Promise.all([
      prisma.cage.create({ data: { zone: 'A', number: 1 } }),
      prisma.cage.create({ data: { zone: 'A', number: 2 } }),
    ]);

    const adoptable = await adminAgent
      .post('/api/animals')
      .send(buildAnimalPayload({ cageId: cageA.id, status: 'SZUKA_DOMU' }));
    expect(adoptable.status).toBe(StatusCodes.CREATED);
    animalId = adoptable.body.id;

    const other = await adminAgent.post('/api/animals').send(
      buildAnimalPayload({
        name: 'Puszek',
        cageId: cageB.id,
        status: 'ZNALEZIONY',
        description: 'Zwierzę które jeszcze nie szuka domu w schronisku.',
      }),
    );
    expect(other.status).toBe(StatusCodes.CREATED);
    nonAdoptableAnimalId = other.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/adoptions', () => {
    it('Odmawia bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.post('/api/adoptions').send({
        animalId,
        message: 'Chcę adoptować',
      });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.post('/api/adoptions').send({
        animalId,
        message: 'Chcę adoptować',
      });
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Odmawia gdy użytkownik nie uzupełnił danych osobowych', async () => {
      await prisma.user.update({
        where: { email: 'michal@gmail.com' },
        data: {
          phoneNumber: null,
          city: null,
          postalCode: null,
          street: null,
          dateOfBirth: null,
          housingType: null,
          livingConditions: null,
          isFormFilled: false,
        },
      });

      const res = await userAgent.post('/api/adoptions').send({
        animalId,
        message: 'Chcę adoptować',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe(
        'Aby złożyć wniosek o adopcję, uzupełnij najpierw wszystkie dane osobowe w formularzu!',
      );

      await fillAdoptionProfile('michal@gmail.com');
    });

    it('Tworzy wniosek adopcyjny przez użytkownika', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const res = await userAgent.post('/api/adoptions').send({
        animalId,
        message: 'Mam doświadczenie z psami i duży ogród.',
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.msg).toBe('Wniosek adopcyjny został utworzony!');
      expect(res.body).toHaveProperty('id');
      adoptionId = res.body.id;
    });

    it('Zwraca CONFLICT przy duplikacie aktywnego wniosku', async () => {
      // Sprawdza konflikt danych / duplikat (409).
      const res = await userAgent.post('/api/adoptions').send({
        animalId,
        message: 'Drugi wniosek',
      });

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe(
        'Masz już aktywny wniosek adopcyjny dla tego zwierzęcia!',
      );
    });

    it('Zwraca 400 gdy zwierzę nie szuka domu', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await userAgent.post('/api/adoptions').send({
        animalId: nonAdoptableAnimalId,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe(
        'Dla tego zwierzęcia nie można utworzyć adopcji!',
      );
    });
  });

  describe('GET /api/adoptions', () => {
    it('Zwraca listę dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/adoptions?page=1&limit=10');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Filtruje oczekujące wnioski', async () => {
      // Sprawdza filtrowanie wniosków po statusie OCZEKUJACA.
      const res = await adminAgent.get(
        '/api/adoptions?page=1&limit=1&status=OCZEKUJACA',
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('Zwraca własne adopcje zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik może pobrać wyłącznie własne wnioski.
      const res = await userAgent.get('/api/adoptions');
      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      for (const adoption of res.body) {
        expect(adoption.userId).toBeDefined();
      }
    });
  });

  describe('GET /api/adoptions/:id', () => {
    it('Pobiera wniosek po ID', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await workerAgent.get(`/api/adoptions/${adoptionId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(adoptionId);
      expect(res.body.status).toBe('OCZEKUJACA');
    });

    it('Zwraca 404 dla nieistniejącego wniosku', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.get('/api/adoptions/999999');
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe('PATCH /api/adoptions/:id/cancel', () => {
    it('Odmawia pracownikowi', async () => {
      const res = await workerAgent.patch(
        `/api/adoptions/${adoptionId}/cancel`,
      );
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Anuluje własny oczekujący wniosek', async () => {
      const res = await userAgent.patch(`/api/adoptions/${adoptionId}/cancel`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Wniosek adopcyjny został anulowany!');

      const adoption = await prisma.adoption.findUnique({
        where: { id: adoptionId },
        select: { status: true },
      });
      expect(adoption?.status).toBe('ANULOWANA');
    });

    it('Nie pozwala anulować wniosku, który nie jest OCZEKUJACA', async () => {
      const res = await userAgent.patch(`/api/adoptions/${adoptionId}/cancel`);

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe(
        'Możesz anulować tylko oczekujący wniosek adopcyjny!',
      );
    });

    it('Pozwala złożyć nowy wniosek po anulowaniu', async () => {
      const res = await userAgent.post('/api/adoptions').send({
        animalId,
        message: 'Ponowny wniosek po anulowaniu.',
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      adoptionId = res.body.id;
    });
  });

  describe('PATCH /api/adoptions/:id', () => {
    it('Zwraca 400 bez wymaganej notatki', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
        status: 'ZAAKCEPTOWANA',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy format danych!');
    });

    it('Zmienia status oczekującego wniosku', async () => {
      // Sprawdza poprawną aktualizację rekordu.
      const res = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
        status: 'ODRZUCONA',
        employeeNote: 'Brak odpowiednich warunków mieszkaniowych.',
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Adopcja została zaktualizowana!');
    });

    it('Nie pozwala zmienić wniosku, który nie jest OCZEKUJACA', async () => {
      // Sprawdza, że status można zmienić tylko dla wniosku OCZEKUJACA.
      const res = await adminAgent.patch(`/api/adoptions/${adoptionId}`).send({
        status: 'ZAAKCEPTOWANA',
        employeeNote: 'Kolejna zmiana statusu.',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Niedozwolona zmiana statusu adopcji!');
    });

    it('Nie pozwala złożyć ponownego wniosku po odrzuceniu', async () => {
      const res = await userAgent.post('/api/adoptions').send({
        animalId,
        message: 'Ponowny wniosek po odrzuceniu',
      });

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe(
        'Twój poprzedni wniosek o adopcję tego zwierzęcia został odrzucony. Nie możesz złożyć ponownego wniosku.',
      );
    });
  });
});
