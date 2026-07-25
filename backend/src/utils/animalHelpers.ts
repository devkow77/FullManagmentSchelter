import { type Request } from 'express';
import {
  AnimalGender,
  AnimalHealthStatus,
  AnimalSize,
  AnimalStatus,
  AnimalType,
} from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';

// ** ZMIENNE GLOBALNE **//

// DOMYSLNY LIMIT REKORDOW NA STRONE
export const DEFAULT_PAGE_SIZE = 20;

// DOPUSZCZALNE POLA DO SORTOWANIA WYNIKOW
const ANIMAL_SORT_FIELDS = [
  'foundAt',
  'name',
  'id',
  'dateOfBirth',
  'nextVisitDate',
] as const;
type AnimalSortField = (typeof ANIMAL_SORT_FIELDS)[number];

// ** FUNKCJE POMOCNICZE (FP) ** //

// FP 1. ZAMIANA WARTOSCI TEKSTOWEJ "pies,kot" NA TABLICE ["pies", "kot"]
const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// FP 2. FUNKCJA SPRAWDZAJACA, CZY PODANE PARAMETRY NALEZA DO ENUMA (np. czy to prawidlowa plec).
// ZWRACA PRZEFILTEROWANA TABLICE LUB RZUCA WYJATEK BadRequestError.
const parseEnumList = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  errorMsg: string,
): T[] => {
  const items = parseCsvParam(value);
  const invalid = items.find((item) => !allowed.includes(item as T));

  if (invalid) throw new BadRequestError(`${errorMsg}: ${invalid}`);

  return items as T[];
};

// FP 3. KLASA BLEDU UZYWANA DO ZATRZYMYWANIA WALIDACJI PARAMETROW.
// POZWALA UNIKNAC ZAGNIEZDZONEGO IF/ELSE I RZUCIC BLAD, KTORY ZLAPIE BLOK CATCH WYZEJ.
export class BadRequestError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

// FP 4. POBIERA ZAKRES GODZINOWY OD POCZATKU DO KONCA BIEZACEGO DNIA
export const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

type DailyCareUser = { id: number; fullName: string } | null;

type DailyCareRecord = {
  fed: boolean;
  watered: boolean;
  cleaned: boolean;
  fedBy: DailyCareUser;
  wateredBy: DailyCareUser;
  cleanedBy: DailyCareUser;
};

// FP 5. FUNKCJA ZMIENIA W ANIMAL _COUNT { NEEDS: NUMBER } NA NEEDSCOUNT: NUMBER -- //
export const mapAnimalListItem = <
  T extends {
    _count: { needs: number };
    dailyCare?: DailyCareRecord[];
  },
>({
  _count,
  dailyCare,
  ...animal
}: T) => {
  const care = dailyCare?.[0];

  return {
    ...animal,
    needsCount: _count.needs,
    ...(dailyCare !== undefined
      ? {
          todayCare: {
            fed: care?.fed ?? false,
            watered: care?.watered ?? false,
            cleaned: care?.cleaned ?? false,
            fedBy: care?.fedBy ?? null,
            wateredBy: care?.wateredBy ?? null,
            cleanedBy: care?.cleanedBy ?? null,
          },
        }
      : {}),
  };
};

// FP 6. FUNKCJA POMOCNICZA SPRAWDZAJACA I PARSUJACA ID Z PARAMETROW URL
export const getValidAnimalId = (req: Request): number | null => {
  const numericId = Number(req.params.id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

// ** FUNKCJE GLOWNE (FG) ** //

// FG 1. GLOWNA FUNKCJA BUDUJACA ZAPYTANIE DO BAZY NA PODSTAWIE PARAMETROW URL (req.query) //
export const parseAnimalsQuery = (req: Request) => {
  const {
    limit,
    sort,
    status,
    page,
    type,
    gender,
    size,
    traits,
    ageMin,
    ageMax,
    search,
    healthStatus,
    dailyCareStatus,
  } = req.query;

  // -- Ustawianie limitu pobieranych rekordow na strone (max 20) -- //
  let take: number | undefined;
  if (typeof limit === 'string' && limit.length > 0) {
    take = Number(limit);
    if (!Number.isInteger(take) || take < 1)
      throw new BadRequestError('Nieprawidlowy parametr limit (max 20)');
    take = Math.min(take, 20);
  }

  // -- Ustawianie numeru strony, if pageNumber jest undefined, to max rekordow 20 -- //
  let pageNumber: number | undefined;
  if (typeof page === 'string' && page.length > 0) {
    pageNumber = Number(page);
    if (!Number.isInteger(pageNumber) || pageNumber < 1)
      throw new BadRequestError('Nieprawidlowy parametr page (min 1)');
    take = take ?? DEFAULT_PAGE_SIZE;
  }

  // -- Ustawianie sortowania, domyslnie malejaco po dacie znalezienia -- //
  let orderBy: Partial<Record<AnimalSortField, 'asc' | 'desc'>> = {
    foundAt: 'desc',
  };

  // -- Sprawdzanie czy parametr sort jest poprawny -- //
  if (typeof sort === 'string' && sort.length > 0) {
    const [field, direction] = sort.split(':');
    if (
      !field ||
      (direction !== 'asc' && direction !== 'desc') ||
      !ANIMAL_SORT_FIELDS.includes(field as AnimalSortField)
    ) {
      throw new BadRequestError('Nieprawidlowy parametr sort!');
    }
    orderBy = { [field as AnimalSortField]: direction };
  }

  const where: Prisma.AnimalWhereInput = {};

  // -- Dodanie filtru wyszukiwania po nazwie zwierzecia jezeli podano parametr search -- //
  if (typeof search === 'string' && search.trim().length > 0) {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }

  // -- Walidacja i dodawanie filtrow (status, typ, plec, wielkosc, zdrowie) -- //
  const statusVals = parseEnumList(
    status,
    Object.values(AnimalStatus),
    'Nieprawidlowy parametr status',
  );

  if (statusVals.length > 0) where.status = { in: statusVals };

  const typeVals = parseEnumList(
    type,
    Object.values(AnimalType),
    'Nieprawidlowy parametr type',
  );

  if (typeVals.length > 0) where.type = { in: typeVals };

  const genderVals = parseEnumList(
    gender,
    Object.values(AnimalGender),
    'Nieprawidlowy parametr gender',
  );

  if (genderVals.length > 0) where.gender = { in: genderVals };

  const sizeVals = parseEnumList(
    size,
    Object.values(AnimalSize),
    'Nieprawidlowy parametr size',
  );

  if (sizeVals.length > 0) where.size = { in: sizeVals };

  const healthVals = parseEnumList(
    healthStatus,
    Object.values(AnimalHealthStatus),
    'Nieprawidlowy parametr healthStatus',
  );

  if (healthVals.length > 0) where.healthStatus = { in: healthVals };

  // -- Filtr dla cech zwierzecia, sprawdza czy posiada wszystkie podane cechy -- //
  const traitList = parseCsvParam(traits);
  if (traitList.length > 0) {
    where.AND = traitList.map((trait) => ({
      traits: { contains: trait, mode: 'insensitive' },
    }));
  }

  // -- Filtr zakresu wiekowego, zamiana lat na przedzialy dat urodzenia -- //
  if (
    (typeof ageMin === 'string' && ageMin) ||
    (typeof ageMax === 'string' && ageMax)
  ) {
    const min = typeof ageMin === 'string' && ageMin ? Number(ageMin) : 0;
    const max = typeof ageMax === 'string' && ageMax ? Number(ageMax) : 25;

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < 0 ||
      min > max
    ) {
      throw new BadRequestError('Nieprawidlowy zakres wieku!');
    }

    const currentYear = new Date().getFullYear();
    where.dateOfBirth = {
      gte: new Date(currentYear - max, 0, 1),
      lte: new Date(currentYear - min, 11, 31),
    };
  }

  // -- Filtr dziennej opieki: wykonano wszystkie 3 / niewykonano -- //
  if (typeof dailyCareStatus === 'string' && dailyCareStatus.length > 0) {
    if (dailyCareStatus !== 'complete' && dailyCareStatus !== 'incomplete') {
      throw new BadRequestError(
        'Nieprawidlowy parametr dailyCareStatus (complete|incomplete)',
      );
    }

    const { start, end } = getTodayRange();
    const todayCareDate = { date: { gte: start, lt: end } };

    if (dailyCareStatus === 'complete') {
      where.dailyCare = {
        some: {
          ...todayCareDate,
          fed: true,
          watered: true,
          cleaned: true,
        },
      };
    } else {
      where.OR = [
        { dailyCare: { none: todayCareDate } },
        {
          dailyCare: {
            some: {
              ...todayCareDate,
              OR: [{ fed: false }, { watered: false }, { cleaned: false }],
            },
          },
        },
      ];
    }
  }

  // -- Offset dla bazy danych, ile rekordow pominac, zeby wyswietlic wlasciwa strone -- //
  const skip =
    pageNumber !== undefined && take !== undefined
      ? (pageNumber - 1) * take
      : undefined;

  return { take, skip, page: pageNumber, orderBy, where };
};
