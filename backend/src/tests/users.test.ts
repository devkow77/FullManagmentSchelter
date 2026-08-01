import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';

const loginAs = async (email: string) => {
  const agent = request.agent(app);

  const loginRes = await agent.post('/api/auth/login').send({
    email,
    password: 'Haslo12345.',
  });

  expect(loginRes.status).toBe(StatusCodes.OK);

  return agent;
};

describe('Zarządzanie użytkownikami - Testy integracyjne', () => {
  type Agent = ReturnType<typeof request.agent>;

  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;

  let createdUserId: number;

  beforeAll(async () => {
    await usersSeed();

    adminAgent = await loginAs('admin@gmail.com');
    workerAgent = await loginAs('pracownik@gmail.com');
    userAgent = await loginAs('michal@gmail.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('Zwraca listę użytkowników dla pracownika i administratora', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const adminRes = await adminAgent.get('/api/users');
      const workerRes = await workerAgent.get('/api/users');

      expect(adminRes.status).toBe(StatusCodes.OK);
      expect(workerRes.status).toBe(StatusCodes.OK);
      expect(Array.isArray(adminRes.body)).toBe(true);
      expect(adminRes.body.length).toBeGreaterThanOrEqual(1);
      expect(
        adminRes.body.every(
          (user: { role: string }) => user.role === 'UZYTKOWNIK',
        ),
      ).toBe(true);
    });

    it('Zwraca błąd 403 dla zwykłego użytkownika', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent.get('/api/users');

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Brak uprawnień!');
    });
  });

  describe('GET /api/users/workers', () => {
    it('Zwraca wszystkich pracowników i administratorów dla administratora', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/users/workers');

      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(5);
      expect(
        res.body.every((user: { role: string }) => user.role !== 'UZYTKOWNIK'),
      ).toBe(true);
    });

    it('Zwraca pracowników także dla pracownika', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await workerAgent.get('/api/users/workers');

      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(
        res.body.every((user: { role: string }) => user.role !== 'UZYTKOWNIK'),
      ).toBe(true);
    });
  });

  describe('GET /api/users/workers/stats', () => {
    it('Zwraca statystyki pracowników dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/users/workers/stats');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('totals');
      expect(res.body).toHaveProperty('roleDistribution');
    });

    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.get('/api/users/workers/stats');
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET /api/users/:id', () => {
    it('Zwraca dane istniejącego użytkownika dla administratora', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const existingUser = await prisma.user.findUnique({
        where: { email: 'michal@gmail.com' },
      });

      expect(existingUser).not.toBeNull();

      const res = await adminAgent.get(`/api/users/${existingUser!.id}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.email).toBe('michal@gmail.com');
      expect(res.body.fullName).toBe('Michał Kowalski');
    });

    it('Zwraca błąd 403 dla zwykłego użytkownika', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const existingUser = await prisma.user.findUnique({
        where: { email: 'michal@gmail.com' },
      });

      expect(existingUser).not.toBeNull();

      const res = await userAgent.get(`/api/users/${existingUser!.id}`);

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Brak uprawnień!');
    });

    it('Zwraca błąd 400 dla nieprawidłowego ID', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.get('/api/users/nie-liczba');

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowe ID użytkownika!');
    });

    it('Zwraca błąd 404 dla nieistniejącego użytkownika', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.get('/api/users/999999');

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Nie ma użytkownika z takim id!');
    });
  });

  describe('POST /api/users', () => {
    it('Tworzy nowego użytkownika dla administratora', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const uniqueSuffix = Date.now();
      const res = await adminAgent.post('/api/users').send({
        fullName: 'Testowy Uzytkownik',
        email: `test-user-${uniqueSuffix}@example.com`,
        password: 'Haslo12345.',
        gender: 'KOBIETA',
        role: 'UZYTKOWNIK',
        imageUrl: null,
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(`test-user-${uniqueSuffix}@example.com`);

      createdUserId = res.body.id;
    });

    it('Zwraca błąd 400 dla nieprawidłowych danych', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/users').send({
        fullName: '',
        email: 'zly-email',
        password: 'abc',
        gender: 'KOBIETA',
        role: 'UZYTKOWNIK',
        imageUrl: null,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy format danych!');
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('Aktualizuje dane utworzonego użytkownika', async () => {
      // Sprawdza poprawną aktualizację rekordu.
      const res = await adminAgent.patch(`/api/users/${createdUserId}`).send({
        fullName: 'Testowy Uzytkownik Zmieniony',
        email: 'test-user-updated@example.com',
        gender: 'MEZCZYZNA',
        role: 'PRACOWNIK',
        imageUrl: null,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.fullName).toBe('Testowy Uzytkownik Zmieniony');
      expect(res.body.email).toBe('test-user-updated@example.com');
      expect(res.body.role).toBe('PRACOWNIK');
    });

    it('Zwraca błąd 400 dla nieprawidłowego ID', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.patch('/api/users/brak-id').send({
        fullName: 'Test',
        email: 'test2@example.com',
        gender: 'KOBIETA',
        role: 'UZYTKOWNIK',
        imageUrl: null,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowe ID użytkownika!');
    });

    it('Zwraca błąd 400 dla niepoprawnego formatu danych', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.patch(`/api/users/${createdUserId}`).send({
        fullName: '',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy format danych!');
    });

    it('Zwraca błąd 403 dla pracownika', async () => {
      // Sprawdza brak uprawnień pracownika do edycji (403).
      const res = await workerAgent.patch(`/api/users/${createdUserId}`).send({
        fullName: 'Zabroniona Edycja',
        email: 'blocked@example.com',
        gender: 'KOBIETA',
        role: 'UZYTKOWNIK',
        imageUrl: null,
      });

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Brak uprawnień!');
    });
  });

  describe('PATCH /api/users/password', () => {
    it('Odmawia przy złym obecnym haśle', async () => {
      // Sprawdza odmowę zmiany hasła przy błędnym obecnym haśle.
      const res = await userAgent.patch('/api/users/password').send({
        currentPassword: 'ZleHaslo123!',
        newPassword: 'NoweHaslo123!',
        confirmNewPassword: 'NoweHaslo123!',
      });

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(res.body.msg).toBe('Nieprawidłowe obecne hasło!');
    });

    it('Odmawia gdy nowe hasło jest takie samo', async () => {
      // Sprawdza, że nowe hasło musi różnić się od obecnego.
      const res = await userAgent.patch('/api/users/password').send({
        currentPassword: 'Haslo12345.',
        newPassword: 'Haslo12345.',
        confirmNewPassword: 'Haslo12345.',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nowe hasło musi być inne niż obecne!');
    });

    it('Aktualizuje hasło przy poprawnych danych', async () => {
      // Sprawdza poprawną zmianę hasła użytkownika.
      const res = await userAgent.patch('/api/users/password').send({
        currentPassword: 'Haslo12345.',
        newPassword: 'NoweHaslo123!',
        confirmNewPassword: 'NoweHaslo123!',
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Hasło zostało pomyślnie zaktualizowane!');

      await prisma.user.update({
        where: { email: 'michal@gmail.com' },
        data: { password: await bcrypt.hash('Haslo12345.', 10) },
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('Zwraca błąd 400 dla nieprawidłowego ID', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.delete('/api/users/bledne-id');

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowe ID użytkownika!');
    });

    it('Nie pozwala usunąć administratora', async () => {
      // Sprawdza ochronę konta administratora przed usunięciem.
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@gmail.com' },
      });

      expect(adminUser).not.toBeNull();

      const res = await adminAgent.delete(`/api/users/${adminUser!.id}`);

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Nie można usunąć administratora!');
    });

    it('Usuwa utworzonego użytkownika', async () => {
      // Sprawdza poprawne usunięcie rekordu.
      const res = await adminAgent.delete(`/api/users/${createdUserId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyślnie usunięto użytkownika!');

      const deletedUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(deletedUser).toBeNull();
    });
  });
});
