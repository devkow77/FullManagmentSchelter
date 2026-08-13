import request from 'supertest';
import app from '../app';
import { StatusCodes } from 'http-status-codes';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import usersSeed from '../../prisma/seed/usersSeed';

// Mockowanie nodemailer - zapobiega wysyłaniu prawdziwych maili podczas testów
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}));

describe('POST /api/contact', () => {
  beforeAll(async () => {
    await usersSeed();
  });

  it('Powinno pozwolić niezalogowanemu użytkownikowi wysłać wiadomość', async () => {
    // Sprawdza wysyłkę wiadomości kontaktowej.
    const res = await request(app).post('/api/contact').send({
      fullName: 'Niezalogowany',
      email: 'niezalogowany@example.com',
      message: 'Testowa wiadomość',
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe('Wiadomość została wysłana pomyślnie!');
  });

  it('Powinno pozwolić użytkownikowi z rolą USER wysłać wiadomość', async () => {
    // Sprawdza wysyłkę wiadomości kontaktowej.
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'michal@example.com',
      password: 'Haslo12345.',
    });

    expect(loginRes.status).toBe(StatusCodes.OK);

    // Pobieramy token z ciasteczek ustawionych przez serwer
    const cookie = loginRes.get('Set-Cookie');

    const res = await request(app)
      .post('/api/contact')
      .set('Cookie', cookie || []) // Przesyłamy ciasteczko z tokenem
      .send({
        fullName: 'Michał',
        email: 'michal@example.com',
        message: 'Testowa wiadomość od użytkownika',
      });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe('Wiadomość została wysłana pomyślnie!');
  });

  it('Nie powinno pozwolić użytkownikowi z rolą WORKER wysłać wiadomość', async () => {
    // Sprawdza wysyłkę wiadomości kontaktowej.
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'pracownik@example.com',
      password: 'Haslo12345.',
    });

    const cookie = loginRes.get('Set-Cookie');

    const res = await request(app)
      .post('/api/contact')
      .set('Cookie', cookie || [])
      .send({
        fullName: 'Pracownik Ola',
        email: 'pracownik@example.com',
        message: 'Testowa wiadomość od pracownika',
      });

    expect(res.status).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.msg).toBe('Tylko użytkownicy mogą wysyłać wiadomości!');
  });

  it('Nie powinno pozwolić użytkownikowi z rolą ADMIN wysłać wiadomość', async () => {
    // Sprawdza wysyłkę wiadomości kontaktowej.
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Haslo12345.',
    });

    const cookie = loginRes.get('Set-Cookie');

    const res = await request(app)
      .post('/api/contact')
      .set('Cookie', cookie || [])
      .send({
        fullName: 'Admin',
        email: 'admin@example.com',
        message: 'Testowa wiadomość od admina',
      });

    expect(res.status).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.msg).toBe('Tylko użytkownicy mogą wysyłać wiadomości!');
  });

  it('Powinno zwrócić BAD_REQUEST dla nieprawidłowych danych', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/contact').send({
      fullName: '',
      email: 'invalid-email',
      message: '',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });
});
