import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app';
import prisma from '../prisma';
import { StatusCodes } from 'http-status-codes';
import usersSeed from '../../prisma/seed/usersSeed';

const loginAsAdmin = async () => {
  const agent = request.agent(app);

  const loginRes = await agent.post('/api/auth/login').send({
    email: 'admin@gmail.com',
    password: 'Haslo12345.',
  });

  expect(loginRes.status).toBe(StatusCodes.OK);

  return agent;
};

describe('Animal CRUD - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: ReturnType<typeof request.agent>;

  let createdAnimalId: number;

  beforeAll(async () => {
    await usersSeed();
    await prisma.animal.deleteMany({});
    adminAgent = await loginAsAdmin();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. TWORZENIE ZWIERZĘCIA
  describe('POST /api/animals', () => {
    it('Odmawia utworzenia zwierzęcia bez autoryzacji', async () => {
      const res = await publicAgent.post('/api/animals').send({
        name: 'Burek',
        type: 'PIES',
        gender: 'SAMIEC',
        size: 'SREDNI',
        traits: 'Przyjacielski, głośny',
        age: 3,
        description: 'Znaleziony przy drodze krajowej.',
        status: 'ZNALEZIONY',
        foundAt: new Date('2026-01-15T12:00:00.000Z').toISOString(),
        foundLocation: 'Rzeszów',
        imageUrl: ['https://example.com/burek.jpg'],
      });

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(res.body.msg).toBe('Brak tokenu, autoryzacja odmówiona!');
    });

    it('Poprawne utworzenie nowego zwierzęcia', async () => {
      const res = await adminAgent.post('/api/animals').send({
        name: 'Burek',
        type: 'PIES',
        gender: 'SAMIEC',
        size: 'SREDNI',
        traits: 'Przyjacielski, głośny',
        age: 3,
        description: 'Znaleziony przy drodze krajowej.',
        status: 'ZNALEZIONY',
        foundAt: new Date('2026-01-15T12:00:00.000Z').toISOString(),
        foundLocation: 'Rzeszów',
        imageUrl: ['https://example.com/burek.jpg'],
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Burek');

      createdAnimalId = res.body.id;
    });

    it('Zwrócenie błędu walidacji (400) przy niepoprawnych danych wejściowych', async () => {
      const res = await adminAgent.post('/api/animals').send({
        name: '',
        age: -5,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy format danych!');
      expect(res.body).toHaveProperty('errors');
    });
  });

  // 2. POBIERANIE ZWIERZĄT
  describe('GET /api/animals', () => {
    it('Pobranie listy wszystkich zwierząt', async () => {
      const res = await publicAgent.get('/api/animals');

      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(createdAnimalId);
    });
  });

  describe('GET /api/animals/:id', () => {
    it('Poprawne pobranie jednego zwierzęcia po prawidłowym ID', async () => {
      const res = await publicAgent.get(`/api/animals/${createdAnimalId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(createdAnimalId);
      expect(res.body.name).toBe('Burek');
    });

    it('Zwrócenie błędu 400 przy przekazaniu ID, które nie jest liczbą', async () => {
      const res = await publicAgent.get('/api/animals/nie-liczba');

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowe ID zwierzęcia!');
    });

    it('Zwrócenie błędu 404, gdy zwierzę o podanym ID nie istnieje', async () => {
      const res = await publicAgent.get('/api/animals/999999');

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Nie ma zwierzęcia z takim id!');
    });
  });

  // 3. AKTUALIZACJA ZWIERZĘCIA
  describe('PATCH /api/animals/:id', () => {
    it('Poprawna aktualizacja danych zwierzęcia', async () => {
      const res = await adminAgent.patch(`/api/animals/${createdAnimalId}`).send({
        name: 'Burek Zmieniony',
        type: 'PIES',
        gender: 'SAMIEC',
        size: 'DUZY',
        traits: 'Spokojny, ułożony',
        age: 4,
        description: 'Zaktualizowany opis.',
        status: 'SZUKA_DOMU',
        foundAt: new Date('2026-01-15T12:00:00.000Z'),
        foundLocation: 'Rzeszów - Centrum',
        imageUrl: ['https://example.com/burek.jpg'],
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.name).toBe('Burek Zmieniony');
      expect(res.body.size).toBe('DUZY');
      expect(res.body.status).toBe('SZUKA_DOMU');
    });

    it('Zwrócenie błędu 400 przy nieprawidłowym formacie ID', async () => {
      const res = await adminAgent.patch('/api/animals/brak-id').send({
        name: 'Test',
        type: 'KOT',
        gender: 'SAMICA',
        size: 'MALY',
        traits: 'Miła i spokojna',
        age: 1,
        description: 'To jest poprawny opis spełniający limit znaków.',
        status: 'ZNALEZIONY',
        foundAt: new Date().toISOString(),
        foundLocation: 'Kraków',
        imageUrl: [],
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowe ID zwierzęcia!');
    });

    it('Zwrócenie błędu 400 przy niepoprawnym formacie danych w body', async () => {
      const res = await adminAgent.patch(`/api/animals/${createdAnimalId}`).send({
        name: '',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy format danych!');
    });

    it('Zwrócenie błędu 404 podczas próby edycji nieistniejącego zwierzęcia', async () => {
      const res = await adminAgent.patch('/api/animals/999999').send({
        name: 'Felix',
        type: 'KOT',
        gender: 'SAMIEC',
        size: 'MALY',
        traits: 'Cichy i spokojny',
        age: 2,
        description: 'Kot wolnożyjący z osiedla, przyzwyczajony do ludzi.',
        status: 'ZNALEZIONY',
        foundAt: new Date('2026-02-20T10:00:00.000Z').toISOString(),
        foundLocation: 'Gdańsk',
        imageUrl: [],
      });

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Zwierzę nie istnieje!');
    });

    it('Zwrócenie błędu 409 (CONFLICT) gdy data znalezienia jest z przyszłości', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await adminAgent.patch(`/api/animals/${createdAnimalId}`).send({
        name: 'Burek',
        type: 'PIES',
        gender: 'SAMIEC',
        size: 'SREDNI',
        traits: 'Przyjacielski i łagodny',
        age: 3,
        description: 'To jest poprawny opis spełniający limit znaków.',
        status: 'ZNALEZIONY',
        foundAt: tomorrow.toISOString(),
        foundLocation: 'Rzeszów',
        imageUrl: [],
      });

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe(
        'Data znalezienia zwierzęcia jest nieprawidłowa!',
      );
    });
  });

  // 4. USUWANIE ZWIERZĘCIA
  describe('DELETE /api/animals/:id', () => {
    it('Zwrócenie błędu 400 przy usuwaniu z niepoprawnym formatem ID', async () => {
      const res = await adminAgent.delete('/api/animals/bledne-id');

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowe ID zwierzęcia!');
    });

    it('Zwrócenie błędu 404 przy próbie usunięcia nieistniejącego rekordu', async () => {
      const res = await adminAgent.delete('/api/animals/999999');

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Zwierzę nie istnieje!');
    });

    it('Poprawne usunięcie istniejącego zwierzęcia z bazy danych', async () => {
      const res = await adminAgent.delete(`/api/animals/${createdAnimalId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyślnie usunięto zwierzę!');

      const checkDb = await prisma.animal.findUnique({
        where: { id: createdAnimalId },
      });
      expect(checkDb).toBeNull();
    });
  });
});
