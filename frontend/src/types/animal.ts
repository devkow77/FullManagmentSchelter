export type AnimalType = "PIES" | "KOT" | "KROLIK" | "CHOMIK" | "ZOLW" | "INNE";

export type AnimalGender = "SAMICA" | "SAMIEC";

export type AnimalSize = "MALY" | "SREDNI" | "DUZY";

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

export type Cage = {
  id: number;
  zone: string;
  number: number;
  label?: string;
  isOccupied?: boolean;
  animal?: { id: number; name: string } | null;
};

export type Animal = {
  id: number;
  name: string;
  type: AnimalType;
  gender: AnimalGender;
  size: AnimalSize;
  traits: string;
  dateOfBirth: Date | string;
  description: string;
  cageId: number | null;
  cage: Cage | null;
  cageNumber: string | null;
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
  status: AnimalStatus;
  healthStatus: AnimalHealthStatus;
  nextVisitDate: Date | string | null;
  foundAt: Date | string;
  foundLocation: string;
  availableFrom?: Date | string;
  imageUrl: string[];
  createdAt?: Date | string;
};

export type AnimalListItem = {
  id: number;
  name: string;
  type: string;
  gender: string;
  size: string;
  traits: string[];
  dateOfBirth: Date | string;
  cageId: number | null;
  cage: Cage | null;
  cageNumber: string | null;
  status: string;
  healthStatus: string;
  imageUrl: string[];
  needsCount: number;
  nextVisitDate: Date | string | null;
  description: string;
};
