import { z } from "zod";
import {
  emptyStringToNull,
  requiredDateSchema,
} from "@/schemas/common.schema";

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

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMinNextVisitDate = () =>
  toLocalDateInputValue(startOfToday());

export const getMaxPastOrTodayDate = () =>
  toLocalDateInputValue(startOfToday());

const isNotInFuture = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.getTime() <= startOfToday().getTime();
};

const isNotInPast = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.getTime() >= startOfToday().getTime();
};

const pastOrTodayDateSchema = requiredDateSchema.refine(
  isNotInFuture,
  "Data nie może być z przyszłości.",
);

const futureVisitDateSchema = z.preprocess(
  emptyStringToNull,
  z.union([
    z.null(),
    z.coerce.date({ message: "Niepoprawna data." }).refine(
      isNotInPast,
      "Data następnej wizyty nie może być wcześniejsza niż dziś.",
    ),
  ]),
);

export const animalSchema = z.object({
  name: z
    .string()
    .min(3, "Imię musi posiadać minimum 3 znaki.")
    .max(20, "Imię może maksymalnie posiadać 20 znaków."),
  type: AnimalTypeEnum,
  gender: AnimalGenderEnum,
  size: AnimalSizeEnum,
  traits: z.string().min(3, "Cechy muszą posiadać minimum 3 znaki."),
  dateOfBirth: pastOrTodayDateSchema,
  description: z
    .string()
    .min(20, "Opis musi mieć co najmniej 20 znaków.")
    .max(500, "Opis może mieć maksymalnie 500 znaków."),
  status: AnimalStatusEnum,
  healthStatus: AnimalHealthStatusEnum,
  nextVisitDate: futureVisitDateSchema,
  foundAt: pastOrTodayDateSchema,
  foundLocation: z
    .string()
    .min(3, "Miejsowość musi posiadać minimum 3 znaki.")
    .max(40, "Miejscowość może maksymalnie posiadać 40 znaków."),
  cageId: z.coerce
    .number({ message: "Klatka jest wymagana." })
    .int("Klatka jest wymagana.")
    .positive("Klatka jest wymagana."),
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
