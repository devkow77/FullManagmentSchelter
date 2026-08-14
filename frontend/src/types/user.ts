export type UserRole = "UZYTKOWNIK" | "ADMINISTRATOR" | "PRACOWNIK";

export type UserGender = "MEZCZYZNA" | "KOBIETA";

export type HousingType = "DOM" | "MIESZKANIE" | "INNE";

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

/** Dane ankiety adopcyjnej wypełnianej przez użytkownika. */
export type AdoptionSurvey = {
  phoneNumber: string | null;
  city: string | null;
  postalCode: string | null;
  street: string | null;
  dateOfBirth: string | null;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  housingType: HousingType | null;
  hasGardenOrBalcony: boolean;
  livingConditions: string | null;
};

/** Pełny profil użytkownika widoczny dla administratora. */
export type UserDetails = AdoptionSurvey & {
  id: number;
  fullName: string;
  email: string;
  gender: string;
  role: string;
  isBanned: boolean;
  adminNote: string | null;
  imageUrl: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
};

/** Profil zalogowanego użytkownika (GET /api/users/me). */
export type OwnProfile = Omit<UserDetails, "role" | "isBanned" | "adminNote">;
