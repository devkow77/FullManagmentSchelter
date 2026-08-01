import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import { type Agent, loginAs, SEED_PASSWORD } from './testHelpers';

describe('Ban aktywnej sesji - Testy integracyjne', () => {
  let userAgent: Agent;
  let userId: number;

  beforeAll(async () => {
    await usersSeed();

    const user = await prisma.user.findUnique({
      where: { email: 'michal@gmail.com' },
    });
    expect(user).not.toBeNull();
    userId = user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    userAgent = await loginAs('michal@gmail.com');
  });

  afterAll(async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });
    await prisma.$disconnect();
  });

  it('Zalogowany użytkownik ma dostęp do /api/auth/info', async () => {
    // Sprawdza, że aktywna sesja działa przed banem.
    const res = await userAgent.get('/api/auth/info');

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.email).toBe('michal@gmail.com');
  });

  it('Po ustawieniu isBanned=true aktywna sesja jest odcinana', async () => {
    // Sprawdza, że middleware blokuje zbanowanego użytkownika mimo ważnego JWT.
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });

    const res = await userAgent.get('/api/auth/info');

    expect(res.status).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.msg).toBe('Twoje konto zostało zablokowane!');
  });

  it('Zbanowany użytkownik nie może się ponownie zalogować', async () => {
    // Sprawdza blokadę logowania dla zbanowanego konta (403).
    const res = await request(app).post('/api/auth/login').send({
      email: 'michal@gmail.com',
      password: SEED_PASSWORD,
    });

    expect(res.status).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.msg).toBe('Twoje konto zostało zablokowane!');
  });

  it('Admin może zdjąć bana i użytkownik odzyskuje dostęp po nowym logowaniu', async () => {
    // Sprawdza przywrócenie dostępu po odblokowaniu konta.
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'michal@gmail.com',
      password: SEED_PASSWORD,
    });
    expect(loginRes.status).toBe(StatusCodes.OK);
    expect(loginRes.body.user.email).toBe('michal@gmail.com');

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({
      email: 'michal@gmail.com',
      password: SEED_PASSWORD,
    });
    const infoRes = await agent.get('/api/auth/info');
    expect(infoRes.status).toBe(StatusCodes.OK);
  });
});
