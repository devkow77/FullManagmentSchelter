import request from 'supertest';
import app from '../app';
import { StatusCodes } from 'http-status-codes';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import usersSeed from '../../prisma/seed/usersSeed';
import prisma from '../prisma';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}));

describe('Newsletter API', () => {
  beforeAll(async () => {
    await usersSeed();
    await prisma.newsletterSubscriber.deleteMany();
  });

  it('Powinno zapisać nowy email do newslettera', async () => {
    // Sprawdza poprawne utworzenie zasobu.
    const res = await request(app).post('/api/newsletter/subscribe').send({
      email: 'newsletter@test.com',
      consent: true,
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe('Pomyślnie zapisano do newslettera!');
  });

  it('Powinno zwrócić komunikat dla już zapisanego emaila', async () => {
    // Sprawdza komunikat dla już istniejącej subskrypcji newslettera.
    const res = await request(app).post('/api/newsletter/subscribe').send({
      email: 'newsletter@test.com',
      consent: true,
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe('Ten adres email jest już zapisany do newslettera!');
  });

  it('Powinno zwrócić BAD_REQUEST bez zgody', async () => {
    // Sprawdza wymóg zgody przy zapisie do newslettera.
    const res = await request(app).post('/api/newsletter/subscribe').send({
      email: 'brak-zgody@test.com',
      consent: false,
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Powinno wypisać użytkownika z newslettera', async () => {
    // Sprawdza wypisanie z newslettera po tokenie.
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: 'newsletter@test.com' },
    });

    expect(subscriber).toBeTruthy();

    const res = await request(app).get(
      `/api/newsletter/unsubscribe/${subscriber!.unsubscribeToken}`,
    );

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe('Pomyślnie wypisano z newslettera!');
  });

  it('Powinno zwrócić NOT_FOUND dla nieprawidłowego tokenu', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).get(
      '/api/newsletter/unsubscribe/nieistniejacy-token',
    );

    expect(res.status).toBe(StatusCodes.NOT_FOUND);
    expect(res.body.msg).toBe('Nie znaleziono subskrypcji newslettera!');
  });
});
