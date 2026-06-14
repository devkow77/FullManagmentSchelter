export type UserRole = "UZYTKOWNIK" | "ADMINISTRATOR" | "PRACOWNIK";

export type UserGender = "MEZCZYZNA" | "KOBIETA";

export type User = {
  id: number;
  fullName: string;
  gender: UserGender | string;
  email: string;
  role: UserRole | string;
  city?: string | null;
  isBanned: boolean;
  isFormFilled: boolean;
  twoFactorEnabled: boolean;
  imageUrl?: string | null;
  createdAt: string;
};

export type Worker = User & {
  city: string;
  hasChildren: boolean;
};
