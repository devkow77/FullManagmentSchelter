import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import { type Agent, clearDomainData, loginAs } from './testHelpers';

describe('Weterynarze - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;
  let vetId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@gmail.com');
    workerAgent = await loginAs('pracownik@gmail.com');
    userAgent = await loginAs('michal@gmail.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/vets', () => {
    it('Odmawia bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.post('/api/vets').send({
        name: 'Dr Kowalski',
        phone: '123456789',
        clinic: 'Klinika Zwierzak',
      });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.post('/api/vets').send({
        name: 'Dr Kowalski',
        phone: '123456789',
        clinic: 'Klinika Zwierzak',
      });
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Tworzy weterynarza', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const res = await adminAgent.post('/api/vets').send({
        name: 'Dr Anna Nowak',
        phone: '123456789',
        clinic: 'Klinika Zwierzak',
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.name).toBe('Dr Anna Nowak');
      vetId = res.body.id;
    });

    it('Zwraca 400 dla niepoprawnych danych', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/vets').send({
        name: 'Ab',
        phone: '123',
        clinic: 'X',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy format danych!');
    });
  });

  describe('GET /api/vets', () => {
    it('Zwraca listę dla pracownika', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await workerAgent.get('/api/vets');

      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('Odmawia zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent.get('/api/vets');
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET /api/vets/:id', () => {
    it('Pobiera weterynarza po ID', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get(`/api/vets/${vetId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(vetId);
    });

    it('Zwraca 404 dla nieistniejącego', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.get('/api/vets/999999');
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe('PATCH /api/vets/:id', () => {
    it('Aktualizuje weterynarza', async () => {
      // Sprawdza poprawną aktualizację rekordu.
      const res = await adminAgent.patch(`/api/vets/${vetId}`).send({
        name: 'Dr Anna Kowalska',
        phone: '987654321',
        clinic: 'Pet Clinic',
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.name).toBe('Dr Anna Kowalska');
      expect(res.body.clinic).toBe('Pet Clinic');
    });
  });

  describe('DELETE /api/vets/:id', () => {
    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.delete(`/api/vets/${vetId}`);
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Usuwa weterynarza', async () => {
      // Sprawdza poprawne usunięcie rekordu.
      const res = await adminAgent.delete(`/api/vets/${vetId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyślnie usunięto weterynarza!');
    });
  });
});
