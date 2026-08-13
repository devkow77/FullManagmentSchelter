import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import { type Agent, clearDomainData, loginAs } from './testHelpers';

describe('Statystyki - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@example.com');
    workerAgent = await loginAs('pracownik@example.com');
    userAgent = await loginAs('michal@example.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/stats', () => {
    it('Odmawia bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.get('/api/stats');
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.get('/api/stats');
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
      expect(res.body.msg).toBe('Brak uprawnień!');
    });

    it('Odmawia zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent.get('/api/stats');
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Zwraca statystyki schroniska dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/stats');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('overview');
      expect(res.body).toHaveProperty('animals');
      expect(res.body).toHaveProperty('adoptions');
      expect(res.body).toHaveProperty('cages');
      expect(res.body).toHaveProperty('medical');
      expect(res.body).toHaveProperty('users');
    });
  });
});
