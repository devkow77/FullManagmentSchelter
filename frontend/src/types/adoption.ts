import type { AdoptionSurvey } from "./user";

/** Decyzje dostępne przed spotkaniem adopcyjnym. */
export type InitialDecisionStatus =
  | "ZAAKCEPTOWANA"
  | "ODRZUCONA"
  | "ANULOWANA";

/** Decyzje dostępne po spotkaniu adopcyjnym. */
export type PostMeetingDecisionStatus = "ZAKONCZONA" | "ANULOWANA";

export type DecisionStatus =
  | InitialDecisionStatus
  | PostMeetingDecisionStatus;

export type Adoption = {
  id: number;
  userId: number;
  animalId: number;
  status: string;
  message: string;
  employeeNote: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  acceptedAt: Date | string | null;
  user: {
    fullName: string;
  };
  animal: {
    id: number;
    name: string;
    description: string;
    imageUrl: string[];
  };
};

/** Dane wnioskodawcy widoczne dla pracownika rozpatrującego wniosek. */
export type AdoptionUser = Partial<AdoptionSurvey> & {
  id: number;
  fullName: string;
  gender: string;
  imageUrl?: string | null;
  adminNote?: string | null;
};

export type AdoptionAnimal = {
  id: number;
  name: string;
  type: string;
  gender: string;
  dateOfBirth: string;
  healthStatus: string;
  traits: string;
  imageUrl: string[];
};

/** Wniosek adopcyjny z danymi wnioskodawcy i zwierzęcia. */
export type AdoptionDetails = {
  status: string;
  message: string | null;
  employeeNote: string | null;
  user: AdoptionUser;
  animal: AdoptionAnimal;
};
