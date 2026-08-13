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
  toLocalDateInputValue,
} from './testHelpers';

describe('Przypisania stref - Testy integracyjne', () => {
  const publicAgent = request.agent(app);
  let adminAgent: Agent;
  let workerAgent: Agent;
  let workerId: number;

  beforeAll(async () => {
    await clearDomainData();
    await usersSeed();

    adminAgent = await loginAs('admin@example.com');
    workerAgent = await loginAs('pracownik@example.com');

    await prisma.cage.create({ data: { zone: 'A', number: 1 } });

    const worker = await prisma.user.findUnique({
      where: { email: 'pracownik@example.com' },
    });
    expect(worker).not.toBeNull();
    workerId = worker!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/zone-assignments/current-week-coverage/status', () => {
    it('Odmawia bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await publicAgent.get(
        '/api/zone-assignments/current-week-coverage/status',
      );
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const res = await workerAgent.get(
        '/api/zone-assignments/current-week-coverage/status',
      );
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Zwraca status pokrycia dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get(
        '/api/zone-assignments/current-week-coverage/status',
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('allZonesCovered');
      expect(typeof res.body.allZonesCovered).toBe('boolean');
    });
  });

  describe('GET /api/zone-assignments/workers-overview', () => {
    it('Zwraca przegląd tygodni dla admina', async () => {
      // Sprawdza poprawne pobranie danych i kształt odpowiedzi.
      const res = await adminAgent.get('/api/zone-assignments/workers-overview');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('weeks');
      expect(res.body).toHaveProperty('workers');
      expect(res.body).toHaveProperty('zones');
    });
  });

  describe('POST /api/zone-assignments', () => {
    it('Odmawia pracownikowi', async () => {
      // Sprawdza, że pracownik nie ma dostępu do tej operacji (403).
      const today = toLocalDateInputValue();
      const res = await workerAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'A',
        dateFrom: today,
        dateTo: today,
      });
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('Zwraca 400 bez pracownika', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const today = toLocalDateInputValue();
      const res = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [],
        zone: 'A',
        dateFrom: today,
        dateTo: today,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Wybierz co najmniej jednego pracownika.');
    });

    it('Zwraca 400 dla daty z przeszłości', async () => {
      // Sprawdza walidację danych wejściowych (400).
      const res = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'A',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-01',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe(
        'Nie można przypisywać stref do dni z przeszłości.',
      );
    });

    it('Przypisuje strefę na dziś', async () => {
      // Sprawdza poprawne utworzenie zasobu.
      const today = toLocalDateInputValue();
      const res = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'A',
        dateFrom: today,
        dateTo: today,
        confirm: true,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('msg');
      expect(res.body.zone).toBe('A');
    });

    it('Po przypisaniu pokrycie strefy A na dziś jest uwzględnione w overview', async () => {
      // Sprawdza, że przypisanie strefy widać w przeglądzie tygodnia.
      const res = await adminAgent.get('/api/zone-assignments/workers-overview');

      expect(res.status).toBe(StatusCodes.OK);
      const zoneA = res.body.zones.find((z: { zone: string }) => z.zone === 'A');
      expect(zoneA).toBeTruthy();
      expect(zoneA.currentWeek.workers.length).toBeGreaterThan(0);
    });

    it('Nie wymaga potwierdzenia gdy ta sama strefa jest w innym tygodniu', async () => {
      // Przypisanie strefy A w poprzednim tygodniu nie koliduje z przyszłym tygodniem.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() + mondayOffset);

      const previousMonday = new Date(currentMonday);
      previousMonday.setDate(currentMonday.getDate() - 7);

      const nextMonday = new Date(currentMonday);
      nextMonday.setDate(currentMonday.getDate() + 7);

      await prisma.dailyZoneAssignment.create({
        data: {
          workerId,
          zone: 'A',
          date: new Date(
            Date.UTC(
              previousMonday.getFullYear(),
              previousMonday.getMonth(),
              previousMonday.getDate(),
              12,
              0,
              0,
            ),
          ),
        },
      });

      const nextMondayKey = toLocalDateInputValue(nextMonday);
      const res = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'A',
        dateFrom: nextMondayKey,
        dateTo: nextMondayKey,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.zone).toBe('A');

      const previousStillExists = await prisma.dailyZoneAssignment.findFirst({
        where: {
          workerId,
          zone: 'A',
          date: {
            gte: previousMonday,
            lt: currentMonday,
          },
        },
      });
      expect(previousStillExists).not.toBeNull();
    });

    it('Wymaga potwierdzenia gdy ta sama strefa jest już w tym samym tygodniu', async () => {
      // Ponowne przypisanie strefy A w aktualnym tygodniu bez confirm → 409.
      const today = toLocalDateInputValue();
      const first = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'B',
        dateFrom: today,
        dateTo: today,
        confirm: true,
      });
      expect(first.status).toBe(StatusCodes.OK);

      const second = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'B',
        dateFrom: today,
        dateTo: today,
      });

      expect(second.status).toBe(StatusCodes.CONFLICT);
      expect(second.body.requiresConfirmation).toBe(true);
    });

    it('Odmawia przypisania poza koniec przyszłego tygodnia', async () => {
      // Zakres poza oknem retencji (dalej niż przyszły tydzień) → 400.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() + mondayOffset);
      const threeWeeksAhead = new Date(currentMonday);
      threeWeeksAhead.setDate(currentMonday.getDate() + 21);
      const tooFar = toLocalDateInputValue(threeWeeksAhead);

      const res = await adminAgent.post('/api/zone-assignments').send({
        workerIds: [workerId],
        zone: 'C',
        dateFrom: tooFar,
        dateTo: tooFar,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe(
        'Można przypisywać strefy maksymalnie do końca przyszłego tygodnia.',
      );
    });

    it('Usuwa przypisania starsze niż 2 tygodnie wstecz przy overview', async () => {
      // Po wejściu w przegląd stare wpisy poza oknem retencji znikają z bazy.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() + mondayOffset);
      const threeWeeksAgo = new Date(currentMonday);
      threeWeeksAgo.setDate(currentMonday.getDate() - 21);

      const created = await prisma.dailyZoneAssignment.create({
        data: {
          workerId,
          zone: 'D',
          date: new Date(
            Date.UTC(
              threeWeeksAgo.getFullYear(),
              threeWeeksAgo.getMonth(),
              threeWeeksAgo.getDate(),
              12,
              0,
              0,
            ),
          ),
        },
      });

      const res = await adminAgent.get('/api/zone-assignments/workers-overview');
      expect(res.status).toBe(StatusCodes.OK);

      const leftover = await prisma.dailyZoneAssignment.findUnique({
        where: { id: created.id },
      });
      expect(leftover).toBeNull();
    });
  });
});
