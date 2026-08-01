import { type Request, type Response } from 'express';
import prisma from '../prisma';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

// 1. Rejestracja nowego konta użytkownika
export const registerAccount = async (req: Request, res: Response) => {
  const parsedBody = registerSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const { fullName, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Konto o podanym emailu już istnieje!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
      },
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ msg: 'Utworzono pomyślnie nowego użytkownika!' });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

// 2. Logowanie do konta użytkownika
export const loginToAccount = async (req: Request, res: Response) => {
  const parsedBody = loginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Niepoprawny format danych!' });
  }

  const { email, password } = parsedBody.data; // Używaj danych zwalidowanych przez Zod

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // Generyczny komunikat błędu (nie podpowiadamy, czy zawiódł mail czy hasło)
    if (!existingUser) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Niepoprawny email lub hasło!' });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Niepoprawny email lub hasło!' });
    }

    if (existingUser.isBanned) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: 'Twoje konto zostało zablokowane!' });
    }

    // Jeżeli użytkownik ma 2FA włączone
    if (existingUser.twoFactorEnabled){
      const tempToken = jwt.sign({userId: existingUser.id, twoFactorEnabled: true}, process.env.JWT_SECRET!, {expiresIn: '5m'});
      return res.status(StatusCodes.OK).json({requires2FA: true, tempToken})
    }

    // Etap logowania bez 2FA
    const token = generateToken({
      userId: existingUser.id,
      userRole: existingUser.role,
    });

    // Wyciągamy dane bez hasła
    const userResponse = {
      fullName: existingUser.fullName,
      email: existingUser.email,
      role: existingUser.role,
    };

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 3600 * 24, // Zwiększyłem do 24h, żeby sesja nie wygasła za szybko
        path: '/',
      })
      .status(StatusCodes.OK)
      .json({
        user: userResponse,
      });
  } catch (err) {
    console.error(err); // Zawsze loguj błędy na serwerze!
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

// 3. Pobieranie informacji o użytkowniku
export const authInfo = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Błąd autoryzacji' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Użytkownik nie istnieje' });
    }

    return res.status(StatusCodes.OK).json(user);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Błąd serwera' });
  }
};

// 4. Wylogowanie użytkownika (usuniecie tokenu)
export const logout = (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
    .status(StatusCodes.NO_CONTENT)
    .json({ msg: 'Pomyślnie wylogowano' });
};

// 5. Generowanie QR dla 2FA
export const generateTwoFactorQR = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Użytkownik nie istnieje' });
    }

    let secretBase32 = user.twoFactorSecret;
    let otpauthUrl: string;

    if (!secretBase32) {
      const secret = speakeasy.generateSecret({
        length: 20,
        name: 'Schronisko',
      });

      if (!secret.otpauth_url) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ msg: 'Nie udało się wygenerować URL' });
      }

      secretBase32 = secret.base32;
      otpauthUrl = secret.otpauth_url;

      await prisma.user.update({
        where: { id: req.userId },
        data: {
          twoFactorSecret: secret.base32,
        },
      });
    } else {
      otpauthUrl = speakeasy.otpauthURL({
        secret: secretBase32,
        label: 'Schronisko',
        issuer: 'Schronisko',
        encoding: 'base32',
      });
    }
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return res.status(StatusCodes.OK).json({
      qrCode,
      manualKey: secretBase32,
    });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Błąd serwera' });
  }
};

// 6. Werifikuj kod TOPT
export const verifyTwoFactorCode = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  const { code } = req.body;

  if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Brak tokenu uwierzytelniającego' });

  if (!code) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Kod TOTP jest wymagany' });

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
  };

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.twoFactorSecret)
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: '2FA nie zostało zainicjalizowane' });

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Nieprawidłowy kod TOTP' });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  res.status(StatusCodes.OK).json({ msg: 'Uwierzytelnianie dwuetapowe włączone, nastąpi wylogowanie z konta' });
};

// 7. Wyłącz 2FA
export const disableTwoFactor = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Brak tokenu' });
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
  };

  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    },
  });

  res.status(200).json({ msg: '2FA zostało wyłączone' });
};

// 8. Logowanie użytkownika z 2FA
export const loginWithTotp = async (req: Request, res: Response) => {
  const { code, tempToken } = req.body;

  if (!code || !tempToken) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Brak danych' });
  }

  let payload;

  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET!) as {
      userId: number;
      twoFactorEnabled: boolean;
    };
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Token wygasł' });
  }

  if (!payload.twoFactorEnabled) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Nieprawidłowy token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.twoFactorSecret) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: '2FA nieaktywne' });
  }

  if (user.isBanned) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: 'Twoje konto zostało zablokowane!' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Nieprawidłowy kod' });
  }

  const token = generateToken({ userId: user.id, userRole: user.role });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60,
  });

  res.status(200).json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
};
