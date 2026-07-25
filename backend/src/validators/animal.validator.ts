import { z } from 'zod';

const TypeEnum = z.enum(['PIES', 'KOT', 'KROLIK', 'CHOMIK', 'ZOLW', 'INNE'], {
  message: 'Typ zwierzęcia jest wymagany.',
});
const GenderEnum = z.enum(['SAMIEC', 'SAMICA'], {
  message: 'Płeć zwierzęcia jest wymagana.',
});
const SizeEnum = z.enum(['MALY', 'SREDNI', 'DUZY'], {
  message: 'Rozmiar zwierzęcia jest wymagany.',
});
const StatusEnum = z.enum(
  ['SZUKA_DOMU', 'ZNALEZIONY', 'W_TRAKCIE_ADOPCJI', 'ADOPTOWANY'],
  {
    message: 'Status zwierzęcia jest wymagany.',
  },
);
const HealthStatusEnum = z.enum(
  ['ZDROWY', 'CHORY', 'ZARAŻONY', 'POTRZEBUJE_OPERACJI'],
  {
    message: 'Stan zdrowia jest wymagany.',
  },
);

export const animalSchema = z.object({
  name: z
    .string()
    .min(3, 'Imię musi posiadać minimum 3 znaki.')
    .max(20, 'Imię może maksymalnie posiadać 20 znaków.'),
  type: TypeEnum,
  gender: GenderEnum,
  size: SizeEnum,
  traits: z.string().min(3, 'Cechy muszą posiadać minimum 3 znaki.'),
  dateOfBirth: z.preprocess(
    (val) => {
      if (val === '' || val == null) return undefined;
      return val;
    },
    z.coerce.date({
      message: 'Data urodzenia jest wymagana.',
    }),
  ),
  description: z
    .string()
    .min(20, 'Opis musi mieć co najmniej 20 znaków.')
    .max(500, 'Opis może mieć maksymalnie 500 znaków.'),
  status: StatusEnum,
  healthStatus: HealthStatusEnum,
  nextVisitDate: z.preprocess(
    (val) => {
      if (val === '' || val == null) return undefined;
      return val;
    },
    z.coerce.date({
      message: 'Data następnej wizyty jest wymagana.',
    }),
  ),
  foundAt: z.preprocess(
    (val) => {
      if (val === '' || val == null) return undefined;
      return val;
    },
    z.coerce.date({
      message: 'Data znalezienia jest wymagana.',
    }),
  ),
  foundLocation: z
    .string()
    .min(3, 'Miejsowość musi posiadać minimum 3 znaki.')
    .max(40, 'Miejscowość może maksymalnie posiadać 40 znaków.'),
  cageNumber: z
    .string()
    .min(1, 'Numer klatki jest wymagany.')
    .max(20, 'Numer klatki może mieć maksymalnie 20 znaków.'),
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
  imageUrl: z.array(z.string()).max(5, 'Możesz dodać maksymalnie 5 zdjęć.'),
});
