import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import {
  type Agent,
  clearDomainData,
  loginAs,
} from './testHelpers';

describe('Klatki - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;
  let createdCageId: number;
  let occupiedCageId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@example.com');
    workerAgent = await loginAs('pracownik@example.com');
    userAgent = await loginAs('michal@example.com');

    const occupied = await prisma.cage.create({
      data: { zone: 'Z', number: 99 },
    });
    occupiedCageId = occupied.id;

    await prisma.animal.create({
      data: {
        name: 'Lokator',
        type: 'PIES',
        gender: 'SAMIEC',
        size: 'SREDNI',
        traits: 'Spokojny pies',
        dateOfBirth: new Date('2020-01-01'),
        description: 'Zwierzę zajmujące klatkę na potrzeby testów usuwania.',
        status: 'ZNALEZIONY',
        healthStatus: 'ZDROWY',
        foundAt: new Date('2025-01-01'),
        foundLocation: 'Rzeszów',
        imageUrl: [],
        cageId: occupiedCageId,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/cages', () => {
    it('Odmawia dostępu bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.get('/api/cages');
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Zwraca listę klatek dla admina i pracownika', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const adminRes = await adminAgent.get('/api/cages');
      const workerRes = await workerAgent.get('/api/cages');

      expect(adminRes.status).toBe(StatusCodes.OK);
      expect(workerRes.status).toBe(StatusCodes.OK);
      expect(Array.isArray(adminRes.body) || Array.isArray(adminRes.body.data)).toBe(
        true,
      );
    });

    it('Odmawia zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent.get('/api/cages');
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET /api/cages/options', () => {
    it('Zwraca opcje stref i numerów', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/cages/options');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('zones');
      expect(res.body).toHaveProperty('numbers');
      expect(res.body).toHaveProperty('byZone');
    });
  });

  describe('POST /api/cages', () => {
    it('Pozwala utworzyć klatkę pracownikowi', async () => {
      const res = await workerAgent.post('/api/cages').send({
        zone: 'D',
        number: 9,
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.zone).toBe('D');
      expect(res.body.number).toBe(9);

      await prisma.cage.delete({ where: { id: res.body.id } });
    });

    it('Tworzy nową klatkę', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const res = await adminAgent.post('/api/cages').send({
        zone: 'B',
        number: 1,
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.zone).toBe('B');
      expect(res.body.number).toBe(1);
      createdCageId = res.body.id;
    });

    it('Zwraca CONFLICT dla duplikatu strefy i numeru', async () => {
      // Sprawdza konflikt danych / duplikat (409).
      const res = await adminAgent.post('/api/cages').send({
        zone: 'B',
        number: 1,
      });

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toContain('już istnieje');
    });

    it('Zwraca 400 dla niepoprawnej strefy', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/cages').send({
        zone: 'AB',
        number: 1,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Strefa musi być jedną literą (np. A, B, C).');
    });
  });

  describe('GET /api/cages/:id', () => {
    it('Pobiera klatkę po ID', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get(`/api/cages/${createdCageId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(createdCageId);
    });

    it('Zwraca 404 dla nieistniejącej klatki', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.get('/api/cages/999999');
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Klatka nie istnieje!');
    });
  });

  describe('PATCH /api/cages/:id', () => {
    it('Aktualizuje klatkę', async () => {
      // Sprawdza poprawną aktualizację rekordu.
      const res = await adminAgent.patch(`/api/cages/${createdCageId}`).send({
        zone: 'C',
        number: 5,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.zone).toBe('C');
      expect(res.body.number).toBe(5);
    });
  });

  describe('DELETE /api/cages/:id', () => {
    it('Nie pozwala usunąć zajętej klatki', async () => {
      // Sprawdza konflikt danych / duplikat (409).
      const res = await adminAgent.delete(`/api/cages/${occupiedCageId}`);

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.msg).toBe(
        'Nie można usunąć zajętej klatki. Najpierw przenieś zwierzę.',
      );
    });

    it('Usuwa pustą klatkę', async () => {
      // Sprawdza poprawne usunięcie rekordu.
      const res = await adminAgent.delete(`/api/cages/${createdCageId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyślnie usunięto klatkę!');
    });
  });
});
