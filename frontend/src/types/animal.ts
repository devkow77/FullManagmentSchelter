import type { Cage } from "./cage";

export type AnimalType = "PIES" | "KOT" | "KROLIK" | "CHOMIK" | "ZOLW" | "INNE";

export type AnimalGender = "SAMICA" | "SAMIEC";

export type AnimalSize = "MALY" | "SREDNI" | "DUZY";

export type AnimalEnergyLevel = "NISKI" | "SREDNI" | "WYSOKI";

export type AnimalStatus =
  | "SZUKA_DOMU"
  | "ZNALEZIONY"
  | "W_TRAKCIE_ADOPCJI"
  | "ADOPTOWANY";

export type AnimalHealthStatus =
  | "ZDROWY"
  | "CHORY"
  | "ZARAŻONY"
  | "POTRZEBUJE_OPERACJI";

/** Cechy behawioralne zwierzęcia zapisane jako flagi. */
export type AnimalTraitFlags = {
  isSterilized: boolean;
  isVaccinated: boolean;
  isChildFriendly: boolean;
  isTrained: boolean;
  lovesPlay: boolean;
  lovesWalks: boolean;
  acceptsDogs: boolean;
  acceptsCats: boolean;
  lovesAffection: boolean;
  poorlyToleratesShelter: boolean;
};

/** Pełne dane zwierzęcia (GET /api/animals/:id). */
export type Animal = AnimalTraitFlags & {
  id: number;
  name: string;
  type: AnimalType;
  gender: AnimalGender;
  size: AnimalSize;
  breed: string;
  energyLevel: AnimalEnergyLevel;
  traits: string;
  dateOfBirth: Date | string;
  description: string;
  cageId: number | null;
  cage: Cage | null;
  cageNumber: string | null;
  status: AnimalStatus;
  healthStatus: AnimalHealthStatus;
  nextVisitDate: Date | string | null;
  foundAt: Date | string;
  foundLocation: string;
  availableFrom?: Date | string;
  imageUrl: string[];
  createdAt?: Date | string;
};

/** Pozycja listy zwierząt (GET /api/animals). */
export type AnimalListItem = {
  id: number;
  name: string;
  type: AnimalType;
  gender: AnimalGender;
  size: AnimalSize;
  breed: string;
  energyLevel: AnimalEnergyLevel;
  traits: string;
  dateOfBirth: Date | string;
  description: string;
  cageId: number | null;
  cage: Cage | null;
  cageNumber: string | null;
  status: AnimalStatus;
  healthStatus: AnimalHealthStatus;
  nextVisitDate: Date | string | null;
  foundAt: Date | string;
  foundLocation: string;
  imageUrl: string[];
  needsCount: number;
};

/** Skrócone dane zwierzęcia do list wyboru w formularzach. */
export type AnimalOption = {
  id: number;
  name: string;
  type: string;
};

/** Minimalny zestaw danych wymagany przez kartę zwierzęcia. */
export type AnimalCardItem = {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: Date | string;
  description: string;
};

/** Zwierzę na liście znalezionych (GET /api/animals/found). */
export type FoundAnimal = {
  id: number;
  name: string;
  imageUrl: string[];
  description: string;
  foundAt: Date | string;
  foundLocation: string;
};

/** Zwierzę na liście ulubionych. */
export type FavouriteAnimal = {
  id: number;
  name: string;
  description: string;
  gender: string;
  traits: string;
  dateOfBirth: Date | string;
  type: string;
  imageUrl: string[];
};

/** Zwierzę najdłużej czekające na adopcję (sekcja na stronie głównej). */
export type LongestWaitingAnimal = {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: Date | string;
  description: string;
};
