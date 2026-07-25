import { z } from "zod";
import { requiredDateSchema } from "@/schemas/common.schema";

export const AnimalTypeEnum = z.enum(
  ["PIES", "KOT", "KROLIK", "CHOMIK", "ZOLW", "INNE"],
  { message: "Typ zwierzęcia jest wymagany." },
);

export const AnimalGenderEnum = z.enum(["SAMIEC", "SAMICA"], {
  message: "Płeć zwierzęcia jest wymagana.",
});

export const AnimalSizeEnum = z.enum(["MALY", "SREDNI", "DUZY"], {
  message: "Rozmiar zwierzęcia jest wymagany.",
});

export const AnimalStatusEnum = z.enum(
  ["SZUKA_DOMU", "ZNALEZIONY", "W_TRAKCIE_ADOPCJI", "ADOPTOWANY"],
  { message: "Status zwierzęcia jest wymagany." },
);

export const AnimalHealthStatusEnum = z.enum(
  ["ZDROWY", "CHORY", "ZARAŻONY", "POTRZEBUJE_OPERACJI"],
  { message: "Stan zdrowia jest wymagany." },
);

export const animalTypeValues = AnimalTypeEnum.options;
export const animalGenderValues = AnimalGenderEnum.options;
export const animalSizeValues = AnimalSizeEnum.options;
export const animalStatusValues = AnimalStatusEnum.options;
export const animalHealthStatusValues = AnimalHealthStatusEnum.options;

export const animalSchema = z.object({
  name: z
    .string()
    .min(3, "Imię musi posiadać minimum 3 znaki.")
    .max(20, "Imię może maksymalnie posiadać 20 znaków."),
  type: AnimalTypeEnum,
  gender: AnimalGenderEnum,
  size: AnimalSizeEnum,
  traits: z.string().min(3, "Cechy muszą posiadać minimum 3 znaki."),
  dateOfBirth: requiredDateSchema,
  description: z
    .string()
    .min(20, "Opis musi mieć co najmniej 20 znaków.")
    .max(500, "Opis może mieć maksymalnie 500 znaków."),
  status: AnimalStatusEnum,
  healthStatus: AnimalHealthStatusEnum,
  nextVisitDate: requiredDateSchema,
  foundAt: requiredDateSchema,
  foundLocation: z
    .string()
    .min(3, "Miejsowość musi posiadać minimum 3 znaki.")
    .max(40, "Miejscowość może maksymalnie posiadać 40 znaków."),
  cageNumber: z
    .string()
    .min(1, "Numer klatki jest wymagany.")
    .max(20, "Numer klatki może mieć maksymalnie 20 znaków."),
  isSterilized: z.boolean().default(false),
  isVaccinated: z.boolean().default(false),
  isChildFriendly: z.boolean().default(false),
  isTrained: z.boolean().default(false),
  lovesPlay: z.boolean().default(false),
  lovesWalks: z.boolean().default(false),
  acceptsDogs: z.boolean().default(false),
  acceptsCats: z.boolean().default(false),
  lovesAffection: z.boolean().default(false),
  poorlyToleratesShelter: z.boolean().default(false),
  imageUrl: z.array(z.string()).max(5, "Możesz dodać maksymalnie 5 zdjęć."),
});

export type AnimalFormData = z.infer<typeof animalSchema>;
