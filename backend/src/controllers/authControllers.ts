import { type Request, type Response } from 'express';
import prisma from '../prisma';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
} from '../services/emailService';

const EMAIL_CODE_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

const createVerificationCode = () =>
  String(Math.floor(100_000 + Math.random() * 900_000));

const buildVerificationPayload = () => {
  const code = createVerificationCode();
  return {
    code,
    emailVerificationCode: code,
    emailVerificationExpires: new Date(Date.now() + EMAIL_CODE_TTL_MS),
  };
};

// 1. Rejestracja nowego konta użytkownika
export const registerAccount = async (req: Request, res: Response) => {
  const parsedBody = registerSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const { fullName, email, password } = parsedBody.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const verification = buildVerificationPayload();

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ msg: 'Konto o podanym emailu już istnieje!' });
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName,
          password: await bcrypt.hash(password, 10),
          emailVerificationCode: verification.emailVerificationCode,
          emailVerificationExpires: verification.emailVerificationExpires,
        },
      });

      await sendEmailVerification(email, verification.code);

      return res.status(StatusCodes.OK).json({
        msg: 'Na podany adres email wysłano kod weryfikacyjny.',
        email,
        requiresEmailVerification: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationCode: verification.emailVerificationCode,
        emailVerificationExpires: verification.emailVerificationExpires,
      },
    });

    await sendEmailVerification(email, verification.code);

    return res.status(StatusCodes.CREATED).json({
      msg: 'Na podany adres email wysłano kod weryfikacyjny.',
      email,
      requiresEmailVerification: true,
    });
  } catch (err) {
    console.error('[registerAccount]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const parsedBody = verifyEmailSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const { email, code } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isEmailVerified) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: user?.isEmailVerified
          ? 'Ten adres email jest już zweryfikowany.'
          : 'Nie znaleziono konta do weryfikacji.',
      });
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires.getTime() < Date.now()
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Kod weryfikacyjny wygasł. Wyślij nowy kod.',
      });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nieprawidłowy kod weryfikacyjny.',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Adres email został potwierdzony. Możesz się zalogować.',
    });
  } catch (err) {
    console.error('[verifyEmail]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  const parsedBody = resendVerificationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const { email } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isEmailVerified) {
      return res.status(StatusCodes.OK).json({
        msg: 'Jeśli konto wymaga weryfikacji, wysłaliśmy nowy kod na podany adres email.',
      });
    }

    const verification = buildVerificationPayload();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verification.emailVerificationCode,
        emailVerificationExpires: verification.emailVerificationExpires,
      },
    });

    await sendEmailVerification(email, verification.code);

    return res.status(StatusCodes.OK).json({
      msg: 'Jeśli konto wymaga weryfikacji, wysłaliśmy nowy kod na podany adres email.',
    });
  } catch (err) {
    console.error('[resendVerificationEmail]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const parsedBody = forgotPasswordSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const { email } = parsedBody.data;
  const genericMsg =
    'Jeśli konto o podanym adresie istnieje, wysłaliśmy link do resetu hasła.';

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.isEmailVerified && !user.isBanned) {
      const token = crypto.randomBytes(32).toString('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      });

      await sendPasswordResetEmail(email, token);
    }

    return res.status(StatusCodes.OK).json({ msg: genericMsg });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const parsedBody = resetPasswordSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const { token, password } = parsedBody.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Link do resetu hasła jest nieprawidłowy lub wygasł.',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Hasło zostało zmienione. Możesz się zalogować.',
    });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res
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

  const { email, password } = parsedBody.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

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

    if (!existingUser.isEmailVerified) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Potwierdź adres email przed logowaniem.',
        requiresEmailVerification: true,
        email: existingUser.email,
      });
    }

    if (existingUser.isBanned) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: 'Twoje konto zostało zablokowane!' });
    }

    if (existingUser.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { userId: existingUser.id, twoFactorEnabled: true },
        process.env.JWT_SECRET!,
        { expiresIn: '5m' },
      );
      return res
        .status(StatusCodes.OK)
        .json({ requires2FA: true, tempToken });
    }

    const token = generateToken({
      userId: existingUser.id,
      userRole: existingUser.role,
    });

    const userResponse = {
      id: existingUser.id,
      fullName: existingUser.fullName,
      email: existingUser.email,
      role: existingUser.role,
      twoFactorEnabled: existingUser.twoFactorEnabled,
    };

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 3600 * 24,
        path: '/',
      })
      .status(StatusCodes.OK)
      .json({
        user: userResponse,
      });
  } catch (err) {
    console.error('[loginToAccount]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

// 3. Pobieranie informacji o użytkowniku (200 + null dla gościa — bez 401 w konsoli)
export const authInfo = async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(StatusCodes.OK).json(null);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isBanned: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.OK).json(null);
    }

    if (user.isBanned) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Twoje konto zostało zablokowane!',
      });
    }

    const { isBanned: _isBanned, ...safeUser } = user;
    return res.status(StatusCodes.OK).json(safeUser);
  } catch {
    return res.status(StatusCodes.OK).json(null);
  }
};

// 4. Wylogowanie użytkownika (usuniecie tokenu)
export const logout = (_req: Request, res: Response) => {
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

  if (!token)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Brak tokenu uwierzytelniającego' });

  if (!code)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Kod TOTP jest wymagany' });

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
  };

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.twoFactorSecret)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: '2FA nie zostało zainicjalizowane' });

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy kod TOTP' });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  res
    .status(StatusCodes.OK)
    .json({
      msg: 'Uwierzytelnianie dwuetapowe włączone, nastąpi wylogowanie z konta',
    });
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
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Nieprawidłowy token' });
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
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy kod' });
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
