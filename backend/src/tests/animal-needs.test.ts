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

describe('Zapotrzebowania zwierząt - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;

  let animalId: number;
  let needId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@gmail.com');
    workerAgent = await loginAs('pracownik@gmail.com');
    userAgent = await loginAs('michal@gmail.com');

    const cage = await prisma.cage.create({ data: { zone: 'A', number: 1 } });
    const animalRes = await adminAgent
      .post('/api/animals')
      .send(buildAnimalPayload({ cageId: cage.id }));
    expect(animalRes.status).toBe(StatusCodes.CREATED);
    animalId = animalRes.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/animal-needs', () => {
    it('Odmawia bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.post('/api/animal-needs').send({
        animalId,
        name: 'Karma',
        description: 'Brakuje karmy wysokobiałkowej dla dorosłych psów.',
        category: 'JEDZENIE',
      });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Odmawia zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent.post('/api/animal-needs').send({
        animalId,
        name: 'Karma',
        description: 'Brakuje karmy wysokobiałkowej dla dorosłych psów.',
        category: 'JEDZENIE',
      });
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Tworzy zapotrzebowanie', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const res = await workerAgent.post('/api/animal-needs').send({
        animalId,
        name: 'Karma sucha',
        description: 'Brakuje karmy wysokobiałkowej dla dorosłych psów.',
        category: 'JEDZENIE',
      });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.name).toBe('Karma sucha');
      expect(res.body.isActive).toBe(true);
      needId = res.body.id;
    });

    it('Zwraca 400 gdy opis jest za krótki', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/animal-needs').send({
        animalId,
        name: 'Leki',
        description: 'Za krótko',
        category: 'LEKI',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Opis musi mieć co najmniej 20 znaków.');
    });

    it('Zwraca 404 dla nieistniejącego zwierzęcia', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.post('/api/animal-needs').send({
        animalId: 999999,
        name: 'Leki',
        description: 'Potrzebne leki przeciwpasożytnicze dla zwierząt.',
        category: 'LEKI',
      });

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.msg).toBe('Nie znaleziono zwierzęcia.');
    });
  });

  describe('GET /api/animal-needs', () => {
    it('Zwraca listę aktywnych zapotrzebowań', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/animal-needs?page=1&limit=10');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Aktualizuje status needs po utworzeniu', async () => {
      // Sprawdza, że status zapotrzebowań odzwierciedla aktywne potrzeby.
      const res = await adminAgent.get('/api/animals/needs/status');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.hasActiveNeeds).toBe(true);
      expect(res.body.activeNeedsCount).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/animal-needs/:id', () => {
    it('Dezaktywuje zapotrzebowanie', async () => {
      // Sprawdza soft-delete zapotrzebowania (isActive = false).
      const res = await workerAgent.delete(`/api/animal-needs/${needId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Zapotrzebowanie zostało usunięte.');

      const need = await prisma.animalNeed.findUnique({ where: { id: needId } });
      expect(need?.isActive).toBe(false);
    });

    it('Zwraca 404 dla nieistniejącego', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.delete('/api/animal-needs/999999');
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });
});
