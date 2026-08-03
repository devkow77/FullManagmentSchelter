import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app';
import prisma from '../prisma';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';

const testUser = {
  fullName: 'Jan Kowalski',
  email: 'jan@example.com',
  password: 'Haslo12345!',
  confirmPassword: 'Haslo12345!',
};

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.user.deleteMany({ where: { email: 'anna@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'michal@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'zlyemail@example.com' } });
  });

  it('Poprawna rejestracja konta', async () => {
    // Sprawdza utworzenie konta (201), kod weryfikacyjny i zahashowane hasło.
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.body.msg).toBe(
      'Na podany adres email wysłano kod weryfikacyjny.',
    );
    expect(res.body.requiresEmailVerification).toBe(true);
    expect(res.body.email).toBe(testUser.email);

    const created = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(created).not.toBeNull();
    expect(created?.fullName).toBe(testUser.fullName);
    expect(created?.role).toBe('UZYTKOWNIK');
    expect(created?.isEmailVerified).toBe(false);
    expect(created?.emailVerificationCode).toHaveLength(6);
    expect(created?.password).not.toBe(testUser.password);
  });

  it('Weryfikuje email poprawnym kodem', async () => {
    // Sprawdza aktywację konta po podaniu kodu z emaila.
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(user?.emailVerificationCode).toBeTruthy();

    const res = await request(app).post('/api/auth/verify-email').send({
      email: testUser.email,
      code: user!.emailVerificationCode,
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe(
      'Adres email został potwierdzony. Możesz się zalogować.',
    );

    const verified = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(verified?.isEmailVerified).toBe(true);
    expect(verified?.emailVerificationCode).toBeNull();
  });

  it('Brak pozwolenia na rejestrację konta z wykorzystanym emailem', async () => {
    // Sprawdza konflikt danych / duplikat (409) po weryfikacji.
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(StatusCodes.CONFLICT);
    expect(res.body.msg).toBe('Konto o podanym emailu już istnieje!');
  });

  it('Zwrócenie błędu jeżeli hasła są różne', async () => {
    // Sprawdza błąd, gdy hasło i potwierdzenie się różnią.
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Anna Nowak',
      email: 'anna@example.com',
      password: 'Haslo12345!',
      confirmPassword: 'InneHaslo12345!',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Zwrócenie błędu jeżeli hasło nie ma znaku specjalnego', async () => {
    // Sprawdza reguły złożoności hasła (wymagany znak specjalny).
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Michał Nowak',
      email: 'michal@example.com',
      password: 'Haslo12345',
      confirmPassword: 'Haslo12345',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Zwrócenie błędu jeżeli hasło nie ma wielkiej litery', async () => {
    // Sprawdza reguły złożoności hasła.
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Michał Nowak',
      email: 'michal@example.com',
      password: 'haslo12345!',
      confirmPassword: 'haslo12345!',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Zwrócenie błędu jeżeli hasło jest za krótkie', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Michał Nowak',
      email: 'michal@example.com',
      password: 'Ha1!',
      confirmPassword: 'Ha1!',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Zwrócenie błędu jeżeli email ma niepoprawny format', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Michał Nowak',
      email: 'niepoprawny-email',
      password: 'Haslo12345!',
      confirmPassword: 'Haslo12345!',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Zwrócenie błędu jeżeli imię i nazwisko jest za krótkie', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Al',
      email: 'zlyemail@example.com',
      password: 'Haslo12345!',
      confirmPassword: 'Haslo12345!',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });

  it('Zwrócenie błędu jeżeli pola są puste', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/register').send({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Nieprawidłowy format danych!');
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    const existing = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    if (!existing) {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(StatusCodes.CREATED);
    }

    await prisma.user.update({
      where: { email: testUser.email },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });
  });

  it('Poprawne logowanie', async () => {
    // Sprawdza udane logowanie: user w body i cookie token.
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      email: testUser.email,
      fullName: testUser.fullName,
      role: 'UZYTKOWNIK',
    });
    expect(res.body.user).not.toHaveProperty('password');

    const cookies = (res.headers['set-cookie'] ?? []) as string[];
    expect(cookies.some((c) => c.startsWith('token='))).toBe(true);
  });

  it('Brak pozwolenia na logowanie z nieistniejącym emailem', async () => {
    // Sprawdza odpowiedź 404, gdy rekord nie istnieje.
    const res = await request(app).post('/api/auth/login').send({
      email: 'zlyemail@gmail.com',
      password: 'Haslo12345!',
    });

    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.msg).toBe('Niepoprawny email lub hasło!');
  });

  it('Brak pozwolenia na logowanie z niepoprawnym hasłem', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'ZleHaslo12345!',
    });

    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.msg).toBe('Niepoprawny email lub hasło!');
  });

  it('Zwrócenie błędu jeżeli pola logowania są puste', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/login').send({
      email: '',
      password: '',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Niepoprawny format danych!');
  });

  it('Zwrócenie błędu jeżeli email logowania ma niepoprawny format', async () => {
    // Sprawdza walidację danych wejściowych (400).
    const res = await request(app).post('/api/auth/login').send({
      email: 'niepoprawny-email',
      password: 'Haslo12345!',
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe('Niepoprawny format danych!');
  });

  it('Blokuje logowanie zbanowanego użytkownika', async () => {
    // Sprawdza blokadę logowania dla zbanowanego konta (403).
    await prisma.user.update({
      where: { email: testUser.email },
      data: { isBanned: true },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.msg).toBe('Twoje konto zostało zablokowane!');

    await prisma.user.update({
      where: { email: testUser.email },
      data: { isBanned: false },
    });
  });
});

describe('POST /api/auth/forgot-password i /reset-password', () => {
  const newPassword = 'NoweHaslo99!';

  it('Wysyła generyczną odpowiedź i ustawia token resetu', async () => {
    // Sprawdza, że dla istniejącego konta powstaje token resetu hasła.
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: testUser.email,
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe(
      'Jeśli konto o podanym adresie istnieje, wysłaliśmy link do resetu hasła.',
    );

    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(user?.passwordResetToken).toBeTruthy();
    expect(user?.passwordResetExpires).toBeTruthy();
  });

  it('Zmienia hasło poprawnym tokenem', async () => {
    // Sprawdza ustawienie nowego hasła i możliwość logowania.
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(user?.passwordResetToken).toBeTruthy();

    const res = await request(app).post('/api/auth/reset-password').send({
      token: user!.passwordResetToken,
      password: newPassword,
      confirmPassword: newPassword,
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.msg).toBe(
      'Hasło zostało zmienione. Możesz się zalogować.',
    );

    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: newPassword,
    });
    expect(loginRes.status).toBe(StatusCodes.OK);

    // Przywróć hasło testowe na potrzeby kolejnych testów.
    await prisma.user.update({
      where: { email: testUser.email },
      data: {
        password: await bcrypt.hash(testUser.password, 10),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  });

  it('Odrzuca wygasły lub nieprawidłowy token', async () => {
    // Sprawdza walidację tokenu resetu.
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'nieistniejacy-token',
      password: newPassword,
      confirmPassword: newPassword,
    });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.msg).toBe(
      'Link do resetu hasła jest nieprawidłowy lub wygasł.',
    );
  });
});

describe('GET /api/auth/info', () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    const loginRes = await agent.post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(loginRes.status).toBe(StatusCodes.OK);
  });

  it('Zwraca dane użytkownika przy poprawnym tokenie', async () => {
    // Sprawdza dostęp do chronionego endpointu sesji.
    const res = await agent.get('/api/auth/info');

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body).toMatchObject({
      email: testUser.email,
      fullName: testUser.fullName,
      role: 'UZYTKOWNIK',
    });
  });

  it('Zwraca UNAUTHORIZED bez tokenu', async () => {
    // Sprawdza 401 dla /info bez cookie token.
    const res = await request(app).get('/api/auth/info');

    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.msg).toBe('Brak tokenu, autoryzacja odmówiona!');
  });
});

describe('POST /api/auth/logout', () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    const loginRes = await agent.post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(loginRes.status).toBe(StatusCodes.OK);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('Wylogowanie powinno zwrócić NO_CONTENT', async () => {
    // Sprawdza wylogowanie i unieważnienie sesji.
    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(StatusCodes.NO_CONTENT);
  });

  it('Po wylogowaniu /info powinno zwrócić UNAUTHORIZED', async () => {
    // Sprawdza wylogowanie i unieważnienie sesji.
    const res = await agent.get('/api/auth/info');

    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.msg).toBe('Brak tokenu, autoryzacja odmówiona!');
  });
});
