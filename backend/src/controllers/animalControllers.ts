import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { animalSchema } from '../validators/animal.validator';
import { triggerNewAnimalNotification } from '../services/emailService';
import { AnimalStatus } from '../generated/prisma/enums';
import { animalListSelect } from '../selects/animal.select';
import {
  BadRequestError,
  DEFAULT_PAGE_SIZE,
  getTodayRange,
  getValidAnimalId,
  mapAnimalListItem,
  parseAnimalsQuery,
} from '../utils/animalHelpers';
import type { AuthRequest } from '../middlewares/auth.middleware';

const DAILY_CARE_FIELDS = ['fed', 'watered', 'cleaned'] as const;
type DailyCareField = (typeof DAILY_CARE_FIELDS)[number];

const dailyCareUserSelect = {
  id: true,
  fullName: true,
} as const;

const getAnimalListSelect = (includeDailyCare: boolean) => {
  if (!includeDailyCare) return animalListSelect;

  const { start, end } = getTodayRange();

  return {
    ...animalListSelect,
    dailyCare: {
      where: { date: { gte: start, lt: end } },
      take: 1,
      select: {
        fed: true,
        watered: true,
        cleaned: true,
        fedBy: { select: dailyCareUserSelect },
        wateredBy: { select: dailyCareUserSelect },
        cleanedBy: { select: dailyCareUserSelect },
      },
    },
  };
};

// 1. POBIERZ WSZYSTKIE ZWIERZETA (OBSLUGA PAGINACJI JEZELI PODANO PARAMETRY)
export const getAnimals = async (req: Request, res: Response) => {
  try {
    const { take, skip, page, orderBy, where } = parseAnimalsQuery(req);
    const includeDailyCare = req.query.dailyCare === 'true';
    const select = getAnimalListSelect(includeDailyCare);

    // Lista codziennej opieki obejmuje tylko zwierzeta w schronisku
    if (includeDailyCare && where.status === undefined) {
      where.status = { not: AnimalStatus.ADOPTOWANY };
    }

    // -- Jesli page jest ustawiony, uzywamy paginacji -- //
    if (page !== undefined) {
      const pageSize = take ?? DEFAULT_PAGE_SIZE;

      // -- Wykonujemy pobieranie i zliczanie jednoczesnie za pomoca Promise.all -- //
      const [animals, total] = await Promise.all([
        prisma.animal.findMany({
          take: pageSize,
          skip,
          orderBy,
          where,
          select,
        }),
        prisma.animal.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: animals.map(mapAnimalListItem),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      });
    }

    // -- Jesli bez paginacji -- //
    const animals = await prisma.animal.findMany({
      take,
      orderBy,
      where,
      select,
    });

    return res.status(StatusCodes.OK).json(animals.map(mapAnimalListItem));
  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 2. Pobierz jedno zwierze o podanym id
export const getUniqueAnimal = async (req: Request, res: Response) => {
  const numericId = getValidAnimalId(req);

  if (!numericId)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });

  try {
    const animal = await prisma.animal.findUnique({ where: { id: numericId } });

    if (!animal)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Nie ma zwierzecia z takim id!' });

    return res.status(StatusCodes.OK).json(animal);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 3. Zaktualizuj dane wybranego zwierzecia
export const updateUniqueAnimal = async (req: Request, res: Response) => {
  const numericId = getValidAnimalId(req);
  if (!numericId)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });

  const parsedBody = animalSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowy format danych!' });
  }

  try {
    const existing = await prisma.animal.findUnique({
      where: { id: numericId },
    });
    if (!existing)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Zwierze nie istnieje!' });

    const todayTime = new Date().getTime();
    const data = parsedBody.data;

    // Logika walidacji dat z poziomu kontrolera
    // (w przyszlosci warto przeniesc to do zod.refine w pliku animal.validator.ts)
    if (new Date(data.foundAt).getTime() > todayTime) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data znalezienia zwierzecia jest nieprawidlowa!' });
    }
    if (new Date(data.dateOfBirth).getTime() > todayTime) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data urodzenia zwierzecia jest nieprawidlowa!' });
    }
    if (new Date(data.nextVisitDate).getTime() < todayTime) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data nastepnej wizyty jest nieprawidlowa!' });
    }

    const updatedAnimal = await prisma.animal.update({
      where: { id: numericId },
      data,
    });

    // Jezeli zmieniono status na "SZUKA_DOMU", wyslij maila z powiadomieniem
    if (
      existing.status !== AnimalStatus.SZUKA_DOMU &&
      updatedAnimal.status === AnimalStatus.SZUKA_DOMU
    ) {
      triggerNewAnimalNotification(updatedAnimal);
    }

    return res.status(StatusCodes.OK).json(updatedAnimal);
  } catch (err) {
    console.error('[updateUniqueAnimal]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera podczas aktualizacji!' });
  }
};

// 4. Usun zwierze o podanym id z bazy
export const deleteUniqueAnimal = async (req: Request, res: Response) => {
  const numericId = getValidAnimalId(req);
  if (!numericId)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });

  try {
    await prisma.animal.delete({ where: { id: numericId } });
    return res
      .status(StatusCodes.OK)
      .json({ msg: 'Pomyslnie usunieto zwierze!' });
  } catch (err: any) {
    // P2025 to standardowy kod bledu z bazy Prisma oznaczajacy brak szukanego rekordu
    if (err.code === 'P2025')
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Zwierze nie istnieje!' });

    console.error('[deleteUniqueAnimal]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 5. Sprawdz, czy w danym dniu nakarmiono wszystkie niezaadoptowane zwierzeta
export const getDailyCareStatus = async (_req: Request, res: Response) => {
  try {
    const { start, end } = getTodayRange();

    // Ilosc wszystkich zwierzet, ktore nadal przebywaja w schronisku
    const shelterAnimalsCount = await prisma.animal.count({
      where: { status: { not: AnimalStatus.ADOPTOWANY } },
    });

    if (shelterAnimalsCount === 0)
      return res.status(StatusCodes.OK).json({ allComplete: true });

    // Ilosc zwierzat w schronisku, ktore zostaly w pelni obsluzone (woda + karma + sprzatanie) danego dnia
    const completedCareCount = await prisma.animalDailyCare.count({
      where: {
        date: { gte: start, lt: end },
        fed: true,
        watered: true,
        cleaned: true,
        animal: { status: { not: AnimalStatus.ADOPTOWANY } },
      },
    });

    return res
      .status(StatusCodes.OK)
      .json({ allComplete: completedCareCount === shelterAnimalsCount });
  } catch (err) {
    console.error('[getDailyCareStatus]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 6. Sprawdz zapotrzebowanie (czy dany zwierzak czegos pilnie nie potrzebuje)
export const getAnimalNeedsStatus = async (_req: Request, res: Response) => {
  try {
    const activeNeedsCount = await prisma.animalNeed.count({
      where: { isActive: true },
    });
    return res
      .status(StatusCodes.OK)
      .json({ hasActiveNeeds: activeNeedsCount > 0 });
  } catch (err) {
    console.error('[getAnimalNeedsStatus]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 7. Zarejestruj nowe zwierze w systemie
export const createAnimal = async (req: Request, res: Response) => {
  const parsedBody = animalSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidlowy format danych!',
      errors: parsedBody.error.issues,
    });
  }

  try {
    const newAnimal = await prisma.animal.create({ data: parsedBody.data });

    triggerNewAnimalNotification(newAnimal);

    return res.status(StatusCodes.CREATED).json(newAnimal);
  } catch (err) {
    console.error('[createAnimal]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera podczas tworzenia!' });
  }
};

// 8. Odznacz / odznacz ponownie dzienna opieke (jedzenie, woda, sprzatanie)
export const updateAnimalDailyCare = async (
  req: AuthRequest,
  res: Response,
) => {
  const animalId = getValidAnimalId(req);

  if (!animalId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });
  }

  if (!req.userId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Brak tokenu, autoryzacja odmowiona!' });
  }

  const { field, value } = req.body as {
    field?: DailyCareField;
    value?: boolean;
  };

  if (
    !field ||
    !DAILY_CARE_FIELDS.includes(field) ||
    typeof value !== 'boolean'
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidlowe dane. Oczekiwano field (fed|watered|cleaned) oraz value (boolean).',
    });
  }

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: { id: true, status: true },
    });

    if (!animal) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Nie znaleziono zwierzecia o podanym ID!' });
    }

    if (animal.status === AnimalStatus.ADOPTOWANY) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nie mozna odznaczac opieki dla adoptowanego zwierzecia.',
      });
    }

    const { start } = getTodayRange();
    const byIdKey =
      field === 'fed'
        ? 'fedById'
        : field === 'watered'
          ? 'wateredById'
          : 'cleanedById';
    const atKey =
      field === 'fed' ? 'fedAt' : field === 'watered' ? 'wateredAt' : 'cleanedAt';

    const careData = {
      [field]: value,
      [byIdKey]: value ? req.userId : null,
      [atKey]: value ? new Date() : null,
    };

    const record = await prisma.animalDailyCare.upsert({
      where: {
        animalId_date: {
          animalId,
          date: start,
        },
      },
      create: {
        animalId,
        date: start,
        ...careData,
      },
      update: careData,
      select: {
        fed: true,
        watered: true,
        cleaned: true,
        fedBy: { select: dailyCareUserSelect },
        wateredBy: { select: dailyCareUserSelect },
        cleanedBy: { select: dailyCareUserSelect },
      },
    });

    return res.status(StatusCodes.OK).json(record);
  } catch (err) {
    console.error('[updateAnimalDailyCare]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};
