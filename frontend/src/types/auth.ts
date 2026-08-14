import type { UserRole } from "./user";

/** Dane zalogowanego użytkownika trzymane w kontekście sesji. */
export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
};

export type LoginResponse = {
  requires2FA: boolean;
  tempToken: string;
  user: AuthUser;
};

export type TotpLoginResponse = {
  user: AuthUser;
};
