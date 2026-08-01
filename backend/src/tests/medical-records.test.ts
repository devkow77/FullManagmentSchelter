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

describe('Raporty medyczne - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let userAgent: Agent;

  let animalId: number;
  let vetId: number;
  let recordId: number;

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

    const vetRes = await adminAgent.post('/api/vets').send({
      name: 'Dr Test Vet',
      phone: '111222333',
      clinic: 'Test Clinic',
    });
    expect(vetRes.status).toBe(StatusCodes.CREATED);
    vetId = vetRes.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const validRecord = () => ({
    vetId,
    animalId,
    type: 'WIZYTA',
    description: 'Kontrolna wizyta weterynaryjna zwierzęcia w schronisku.',
    date: new Date().toISOString(),
    cost: 150,
    status: 'DO_REALIZACJI',
  });

  describe('POST /api/medical-records', () => {
    it('Odmawia bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.post('/api/medical-records').send(validRecord());
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Odmawia zwykłemu użytkownikowi', async () => {
      // Sprawdza, że zwykły użytkownik nie ma dostępu (403).
      const res = await userAgent.post('/api/medical-records').send(validRecord());
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Tworzy raport medyczny', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const res = await workerAgent.post('/api/medical-records').send(validRecord());

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('DO_REALIZACJI');
      recordId = res.body.id;
    });

    it('Zwraca 400 gdy opis jest za krótki', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/medical-records').send({
        ...validRecord(),
        description: 'Za krótki',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Opis musi mieć co najmniej 20 znaków!');
    });
  });

  describe('GET /api/medical-records', () => {
    it('Zwraca listę z paginacją', async () => {
      // Sprawdza odpowiedź z paginacją (data, total, page).
      const res = await adminAgent.get(
        '/api/medical-records?page=1&limit=10&status=DO_REALIZACJI',
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/medical-records/:id', () => {
    it('Pobiera raport po ID', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await workerAgent.get(`/api/medical-records/${recordId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(recordId);
    });

    it('Zwraca 404 dla nieistniejącego', async () => {
      // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
      const res = await adminAgent.get('/api/medical-records/999999');
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe('PATCH /api/medical-records/:id', () => {
    it('Aktualizuje raport', async () => {
      // Sprawdza poprawną aktualizację rekordu.
      const res = await adminAgent.patch(`/api/medical-records/${recordId}`).send({
        ...validRecord(),
        status: 'ZREALIZOWANA',
        cost: 200,
        description: 'Zaktualizowany opis wizyty weterynaryjnej zwierzęcia.',
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.status).toBe('ZREALIZOWANA');
      expect(res.body.cost).toBe(200);
    });
  });

  describe('DELETE /api/medical-records/:id', () => {
    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.delete(`/api/medical-records/${recordId}`);
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Usuwa raport jako admin', async () => {
      // Sprawdza poprawne usunięcie rekordu.
      const res = await adminAgent.delete(`/api/medical-records/${recordId}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('Pomyślnie usunięto raport medyczny!');
    });
  });
});
