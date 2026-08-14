import type { Request } from 'express';
import type { Role } from '../generated/prisma/enums';

// DANE ZAPISYWANE W TOKENIE SESJI
export type JwtPayload = {
  userId: number;
  userRole: Role;
};

// TOKEN IDENTYFIKUJACY WYLACZNIE UZYTKOWNIKA (np. weryfikacja maila, 2FA)
export type JwtUserIdPayload = {
  userId: number;
};

// TYMCZASOWY TOKEN WYDAWANY MIEDZY LOGOWANIEM A KODEM 2FA
export type JwtTwoFactorPayload = JwtUserIdPayload & {
  twoFactorEnabled: boolean;
};

// REQUEST WZBOGACONY O DANE UZYTKOWNIKA PRZEZ MIDDLEWARE AUTORYZACJI
export interface AuthRequest extends Request {
  userId?: number;
  userRole?: Role;
}
