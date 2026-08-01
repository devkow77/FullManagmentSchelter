import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import speakeasy from 'speakeasy';
import { StatusCodes } from 'http-status-codes';
import app from '../app';
import prisma from '../prisma';
import usersSeed from '../../prisma/seed/usersSeed';
import { type Agent, loginAs, SEED_PASSWORD } from './testHelpers';

describe('Auth 2FA - Testy integracyjne', () => {
  let agent: Agent;
  let userId: number;
  let manualKey: string;
  let tempToken: string;

  beforeAll(async () => {
    await usersSeed();

    const user = await prisma.user.findUnique({
      where: { email: 'michal@gmail.com' },
    });
    expect(user).not.toBeNull();
    userId = user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, isBanned: false },
    });

    agent = await loginAs('michal@gmail.com');
  });

  afterAll(async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, isBanned: false },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/auth/2fa/setup', () => {
    it('Generuje QR i klucz ręczny dla zalogowanego użytkownika', async () => {
      // Sprawdza inicjalizację 2FA: zwraca qrCode oraz manualKey.
      const res = await agent.get('/api/auth/2fa/setup');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('qrCode');
      expect(res.body).toHaveProperty('manualKey');
      expect(typeof res.body.manualKey).toBe('string');
      expect(res.body.manualKey.length).toBeGreaterThan(10);

      manualKey = res.body.manualKey;

      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      expect(dbUser?.twoFactorSecret).toBe(manualKey);
      expect(dbUser?.twoFactorEnabled).toBe(false);
    });

    it('Odmawia setup bez tokena', async () => {
      // Sprawdza odmowę dostępu bez cookie sesji (401).
      const res = await request(app).get('/api/auth/2fa/setup');
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('POST /api/auth/2fa/verify', () => {
    it('Odmawia przy złym kodzie TOTP', async () => {
      // Sprawdza walidację kodu TOTP (400 przy nieprawidłowym kodzie).
      const res = await agent.post('/api/auth/2fa/verify').send({
        code: '000000',
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy kod TOTP');
    });

    it('Włącza 2FA przy poprawnym kodzie', async () => {
      // Sprawdza aktywację 2FA po poprawnej weryfikacji TOTP.
      const code = speakeasy.totp({
        secret: manualKey,
        encoding: 'base32',
      });

      const res = await agent.post('/api/auth/2fa/verify').send({ code });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toContain('Uwierzytelnianie dwuetapowe włączone');

      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      expect(dbUser?.twoFactorEnabled).toBe(true);
    });
  });

  describe('POST /api/auth/login + /api/auth/2fa/login', () => {
    it('Logowanie zwraca requires2FA i tempToken', async () => {
      // Sprawdza, że przy włączonym 2FA login nie ustawia jeszcze sesji końcowej.
      const res = await request(app).post('/api/auth/login').send({
        email: 'michal@gmail.com',
        password: SEED_PASSWORD,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.requires2FA).toBe(true);
      expect(res.body).toHaveProperty('tempToken');
      expect(res.body).not.toHaveProperty('user');

      const cookies = (res.headers['set-cookie'] ?? []) as string[];
      expect(cookies.some((c) => c.startsWith('token='))).toBe(false);

      tempToken = res.body.tempToken;
    });

    it('Odmawia logowania 2FA przy złym kodzie', async () => {
      // Sprawdza odrzucenie drugiego kroku logowania przy złym TOTP.
      const res = await request(app).post('/api/auth/2fa/login').send({
        code: '000000',
        tempToken,
      });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.msg).toBe('Nieprawidłowy kod');
    });

    it('Kończy logowanie poprawnym kodem TOTP', async () => {
      // Sprawdza pełne logowanie 2FA: user + cookie token.
      const code = speakeasy.totp({
        secret: manualKey,
        encoding: 'base32',
      });

      const res = await request(app).post('/api/auth/2fa/login').send({
        code,
        tempToken,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.user.email).toBe('michal@gmail.com');
      expect(res.body.user.twoFactorEnabled).toBe(true);

      const cookies = (res.headers['set-cookie'] ?? []) as string[];
      expect(cookies.some((c) => c.startsWith('token='))).toBe(true);

      agent = request.agent(app);
      // odtwórz sesję z cookie z odpowiedzi
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeTruthy();
    });
  });

  describe('POST /api/auth/2fa/disable', () => {
    it('Wyłącza 2FA dla zalogowanego użytkownika', async () => {
      // Sprawdza wyłączenie 2FA i wyczyszczenie sekretu.
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'michal@gmail.com',
        password: SEED_PASSWORD,
      });
      expect(loginRes.body.requires2FA).toBe(true);

      const code = speakeasy.totp({
        secret: manualKey,
        encoding: 'base32',
      });

      const totpAgent = request.agent(app);
      const totpRes = await totpAgent.post('/api/auth/2fa/login').send({
        code,
        tempToken: loginRes.body.tempToken,
      });
      expect(totpRes.status).toBe(StatusCodes.OK);

      const res = await totpAgent.post('/api/auth/2fa/disable');

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.msg).toBe('2FA zostało wyłączone');

      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      expect(dbUser?.twoFactorEnabled).toBe(false);
      expect(dbUser?.twoFactorSecret).toBeNull();
    });

    it('Po wyłączeniu 2FA logowanie wraca do zwykłego trybu', async () => {
      // Sprawdza, że login bez 2FA znów zwraca user i cookie.
      const res = await request(app).post('/api/auth/login').send({
        email: 'michal@gmail.com',
        password: SEED_PASSWORD,
      });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.requires2FA).toBeUndefined();
      expect(res.body).toHaveProperty('user');
    });
  });
});
