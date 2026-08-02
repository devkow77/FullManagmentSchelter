import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { animalSchema } from '../validators/animal.validator';
import { triggerNewAnimalNotification } from '../services/emailService';
import { AnimalStatus } from '../generated/prisma/enums';
import { animalListSelect, animalSelect } from '../selects/animal.select';
import {
  BadRequestError,
  DEFAULT_PAGE_SIZE,
  getTodayRange,
  getValidAnimalId,
  mapAnimalDetail,
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

// FUNKCJA SPRAWDZAJACA CZY KLATKA JEST DOSTĘPNA
const assertCageAvailable = async (
  cageId: number,
  excludeAnimalId?: number,
) => {
  const cage = await prisma.cage.findUnique({
    where: { id: cageId },
    include: { animal: { select: { id: true } } },
  });

  // -- Jezeli klatka nie istnieje to zwracamy błąd -- //
  if (!cage) {
    return {
      ok: false as const,
      status: StatusCodes.NOT_FOUND,
      msg: 'Klatka nie istnieje!',
    };
  }

  // -- Jezeli klatka jest zajęta przez inne zwierze to zwracamy błąd -- //
  if (cage.animal && cage.animal.id !== excludeAnimalId) {
    return {
      ok: false as const,
      status: StatusCodes.CONFLICT,
      msg: 'Wybrana klatka jest już zajęta!',
    };
  }

  return { ok: true as const, cage };
};

// JEZELI FLAGA includeDailyCare JEST TRUE TO ZWRACA DODATKOWO DANE Z DZISIEJSZEJ OBSŁUGI
// BEZ FLAGI ZWRACA TYLKO BASOWE DANE ZWIERZAT (animalListSelect)
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

// MAPA STREFA -> PRACOWNICY PRZYPISANI NA DZIS (Z GRAFIKU TYGODNIA PRACY)
const getTodayZoneWorkersMap = async () => {
  // -- Pobieramy daty dla dzisiejszego dnia -- //
  const { start, end } = getTodayRange();

  // -- Pobieramy przypisania stref na dzis -- //
  const assignments = await prisma.dailyZoneAssignment.findMany({
    where: { date: { gte: start, lt: end } },
    select: {
      zone: true,
      worker: { select: dailyCareUserSelect },
    },
    orderBy: { workerId: 'asc' },
  });

  // -- Tworzymy mapę strefa -> pracownicy -- //
  const byZone = new Map<string, { id: number; fullName: string }[]>();

  // -- Iterujemy po przypisaniach stref na dzis -- //
  for (const assignment of assignments) {
    // -- Pobieramy pracowników dla danej strefy -- //
    const workers = byZone.get(assignment.zone) ?? [];
    // -- Jezeli pracownik nie istnieje w mapie to dodajemy go -- //
    if (!workers.some((worker) => worker.id === assignment.worker.id)) {
      workers.push(assignment.worker);
    }
    byZone.set(assignment.zone, workers);
  }

  return byZone;
};

const mapAnimalsWithZoneWorkers = <
  T extends {
    _count: { needs: number };
    cage?: { id: number; zone: string; number: number } | null;
    dailyCare?: {
      fed: boolean;
      watered: boolean;
      cleaned: boolean;
      fedBy: { id: number; fullName: string } | null;
      wateredBy: { id: number; fullName: string } | null;
      cleanedBy: { id: number; fullName: string } | null;
    }[];
  },
>(
  animals: T[],
  zoneWorkers: Map<string, { id: number; fullName: string }[]> | null,
) =>
  animals.map((animal) => {
    const mapped = mapAnimalListItem(animal);
    if (!zoneWorkers) return mapped;

    const zone = animal.cage?.zone;
    return {
      ...mapped,
      assignedWorkers: zone ? (zoneWorkers.get(zone) ?? []) : [],
    };
  });

// 1. POBIERZ WSZYSTKIE ZWIERZETA (OBSLUGA PAGINACJI JEZELI PODANO PARAMETRY)
export const getAnimals = async (req: Request, res: Response) => {
  try {
    const { take, skip, page, orderBy, where } = parseAnimalsQuery(req);
    // -- Flaga czy zwrócic dane z dzisiejszej obsługi -- //
    const includeDailyCare = req.query.dailyCare === 'true';
    const select = getAnimalListSelect(includeDailyCare);

    // -- Jezeli zwracamy dane z dziesiejszej obslugi a nie podamy statusu to zwracamy bez adoptowanych zwierząt -- //
    if (includeDailyCare && where.status === undefined) {
      where.status = { not: AnimalStatus.ADOPTOWANY };
    }

    // -- Jesli page jest ustawiony, uzywamy paginacji -- //
    if (page !== undefined) {
      const pageSize = take ?? DEFAULT_PAGE_SIZE;

      // -- Wykonujemy pobieranie i zliczanie jednoczesnie za pomoca Promise.all -- //
      const [animals, total, zoneWorkers] = await Promise.all([
        prisma.animal.findMany({
          take: pageSize,
          skip,
          orderBy,
          where,
          select,
        }),
        prisma.animal.count({ where }),
        includeDailyCare ? getTodayZoneWorkersMap() : Promise.resolve(null),
      ]);

      return res.status(StatusCodes.OK).json({
        data: mapAnimalsWithZoneWorkers(animals, zoneWorkers),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      });
    }

    // -- Jesli bez paginacji -- //
    const [animals, zoneWorkers] = await Promise.all([
      prisma.animal.findMany({
        take,
        orderBy,
        where,
        select,
      }),
      includeDailyCare ? getTodayZoneWorkersMap() : Promise.resolve(null),
    ]);

    return res
      .status(StatusCodes.OK)
      .json(mapAnimalsWithZoneWorkers(animals, zoneWorkers));
  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 2. POBIERZ ZWIERZE O PODANYM ID
export const getUniqueAnimal = async (req: Request, res: Response) => {
  // -- Pobieramy ID zwierzęcia z parametrów URL -- //
  const numericId = getValidAnimalId(req);

  // -- Jezeli ID nie jest prawidłowe to zwracamy błąd -- //
  if (!numericId)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: numericId },
      select: animalSelect,
    });

    // -- Jezeli zwierze nie istnieje to zwracamy błąd -- //
    if (!animal)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Nie ma zwierzecia z takim id!' });

    return res.status(StatusCodes.OK).json(mapAnimalDetail(animal));
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 3. ZAKTUALIZUJ DANE ZWIERZĘTA O PODANYM ID
export const updateUniqueAnimal = async (req: Request, res: Response) => {
  const numericId = getValidAnimalId(req);

  // -- Jezeli ID nie jest prawidłowe to zwracamy błąd -- //
  if (!numericId)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });

  // -- Walidacja danych zwierzęcia -- //
  const parsedBody = animalSchema.safeParse(req.body);

  // -- Jezeli walidacja nie powiodła się to zwracamy błąd -- //
  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowy format danych!' });
  }

  try {
    const existing = await prisma.animal.findUnique({
      where: { id: numericId },
    });

    // -- Jezeli zwierze nie istnieje to zwracamy błąd -- //
    if (!existing)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Zwierze nie istnieje!' });

    const todayTime = new Date().getTime();
    const data = parsedBody.data;

    // -- Jezeli data znalezienia jest wieksza niz to zwracamy błąd -- //
    if (new Date(data.foundAt).getTime() > todayTime) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data znalezienia zwierzecia jest nieprawidlowa!' });
    }

    // -- Jezeli data urodzenia jest wieksza niz dzisiaj to zwracamy błąd -- //
    if (new Date(data.dateOfBirth).getTime() > todayTime) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data urodzenia zwierzecia jest nieprawidlowa!' });
    }

    // -- Jezeli data następnej wizyty jest wczesniejsza niz dzisiaj to zwracamy błąd -- //
    if (
      data.nextVisitDate &&
      new Date(data.nextVisitDate).getTime() < todayTime
    ) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data nastepnej wizyty jest nieprawidlowa!' });
    }

    // -- Adoptowane zwierzę opuszcza klatkę -- //
    const isAdopted = data.status === AnimalStatus.ADOPTOWANY;
    const updateData = isAdopted ? { ...data, cageId: null } : data;

    if (!isAdopted) {
      const cageCheck = await assertCageAvailable(data.cageId, numericId);
      if (!cageCheck.ok) {
        return res.status(cageCheck.status).json({ msg: cageCheck.msg });
      }
    }

    const updatedAnimal = await prisma.animal.update({
      where: { id: numericId },
      data: updateData,
      select: animalSelect,
    });

    // -- Jezeli zmieniono status na "SZUKA_DOMU", wyslij maila z powiadomieniem -- //
    if (
      existing.status !== AnimalStatus.SZUKA_DOMU &&
      updatedAnimal.status === AnimalStatus.SZUKA_DOMU
    ) {
      triggerNewAnimalNotification(updatedAnimal);
    }

    return res.status(StatusCodes.OK).json(mapAnimalDetail(updatedAnimal));
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera podczas aktualizacji!' });
  }
};

// 4. USUN ZWIERZE O PODANYM ID
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
    if (err.code === 'P2025')
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Zwierze nie istnieje!' });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 5. SPRAWDZ, CZY W DANYM DNIA NAKARMIONO WSZYSTKIE NIEZAADOPTOWANE ZWIERZĘTA
// JEZELI TAK ZWRACA TRUE, JEZELI NIE TO ZWRACA FALSE
export const getDailyCareStatus = async (_req: Request, res: Response) => {
  try {
    const { start, end } = getTodayRange();

    // -- Ilosc wszystkich zwierzet, ktore nadal przebywaja w schronisku -- //
    const shelterAnimalsCount = await prisma.animal.count({
      where: { status: { not: AnimalStatus.ADOPTOWANY } },
    });

    // -- Jezeli nie ma zwierzat w schronisku to zwracamy true -- //
    if (shelterAnimalsCount === 0)
      return res.status(StatusCodes.OK).json({ allComplete: true });

    // -- Ilosc zwierzat w schronisku, ktore zostaly w pelni obsluzone -- //
    // -- Wwoda + karma + sprzatanie danego dnia -- //
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
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 6. POSTEP PRACOWNIKOW, ILE PROCENTOWO ZOSTALO ZREALIZOWANE KLATEK NA DZIS
export const getDailyCareWorkersProgress = async (
  _req: Request,
  res: Response,
) => {
  try {
    // -- Pobieramy zakres dzisiejszego dnia -- //
    const { start, end } = getTodayRange();

    // -- Pobieramy przypisania stref na dzis oraz zwierzeta w schronisku (z dzisiejsza opieka) -- //
    const [assignments, animals] = await Promise.all([
      prisma.dailyZoneAssignment.findMany({
        where: { date: { gte: start, lt: end } },
        select: {
          zone: true,
          worker: {
            select: {
              id: true,
              fullName: true,
              imageUrl: true,
            },
          },
        },
        orderBy: [{ workerId: 'asc' }, { zone: 'asc' }],
      }),
      prisma.animal.findMany({
        where: {
          status: { not: AnimalStatus.ADOPTOWANY },
          cageId: { not: null },
        },
        select: {
          id: true,
          cage: { select: { zone: true } },
          dailyCare: {
            where: { date: { gte: start, lt: end } },
            take: 1,
            select: {
              fed: true,
              watered: true,
              cleaned: true,
            },
          },
        },
      }),
    ]);

    // -- Mapa strefa -> liczba zwierzat oraz liczba w pelni obsluzonych (karma + woda + sprzatanie) -- //
    const cagesByZone = new Map<string, { total: number; completed: number }>();

    // -- Liczymy postep opieki dla kazdej strefy -- //
    for (const animal of animals) {
      const zone = animal.cage?.zone;
      // -- Jezeli zwierze nie ma strefy to pomijamy -- //
      if (!zone) continue;

      const entry = cagesByZone.get(zone) ?? { total: 0, completed: 0 };
      entry.total += 1;

      // -- Jezeli zwierze zostalo w pelni obsluzone to zwiekszamy completed -- //
      const care = animal.dailyCare[0];
      if (care?.fed && care?.watered && care?.cleaned) {
        entry.completed += 1;
      }

      cagesByZone.set(zone, entry);
    }

    // -- Mapa pracownik -> dane oraz zestaw przypisanych stref na dzis -- //
    const byWorker = new Map<
      number,
      {
        id: number;
        fullName: string;
        imageUrl: string | null;
        zones: Set<string>;
      }
    >();

    // -- Grupujemy przypisania stref po pracownikach -- //
    for (const assignment of assignments) {
      const existing = byWorker.get(assignment.worker.id) ?? {
        id: assignment.worker.id,
        fullName: assignment.worker.fullName,
        imageUrl: assignment.worker.imageUrl,
        zones: new Set<string>(),
      };
      existing.zones.add(assignment.zone);
      byWorker.set(assignment.worker.id, existing);
    }

    // -- Liczymy postep procentowy dla kazdego pracownika na podstawie jego stref -- //
    const workers = [...byWorker.values()]
      .map((worker) => {
        const zones = [...worker.zones].sort((a, b) => a.localeCompare(b));
        let totalCages = 0;
        let completedCages = 0;

        // -- Sumujemy zwierzeta ze wszystkich stref przypisanych do pracownika -- //
        for (const zone of zones) {
          const zoneStats = cagesByZone.get(zone);
          if (!zoneStats) continue;
          totalCages += zoneStats.total;
          completedCages += zoneStats.completed;
        }

        // -- Jezeli nie ma zwierzat w strefach to zwracamy 0% -- //
        const percent =
          totalCages === 0
            ? 0
            : Math.round((completedCages / totalCages) * 100);

        return {
          id: worker.id,
          fullName: worker.fullName,
          imageUrl: worker.imageUrl,
          zones,
          completedCages,
          totalCages,
          percent,
        };
      })
      // -- Sortujemy pracownikow alfabetycznie po imieniu i nazwisku -- //
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));

    return res.status(StatusCodes.OK).json({ workers });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 6. SPRAWDZA CZY ZWIERZE MA AKTYWNE POTRZEBY
export const getAnimalNeedsStatus = async (_req: Request, res: Response) => {
  try {
    const activeNeedsCount = await prisma.animalNeed.count({
      where: { isActive: true },
    });
    return res.status(StatusCodes.OK).json({
      hasActiveNeeds: activeNeedsCount > 0,
      activeNeedsCount,
    });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};

// 7. ZAREJESTRUJ NOWE ZWIERZE W SYSTEMIE
export const createAnimal = async (req: Request, res: Response) => {
  const parsedBody = animalSchema.safeParse(req.body);

  // -- Jezeli walidacja nie powiodła się to zwracamy błąd -- //
  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidlowy format danych!',
      errors: parsedBody.error.issues,
    });
  }

  try {
    const todayTime = new Date().getTime();
    const data = parsedBody.data;

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

    if (
      data.nextVisitDate &&
      new Date(data.nextVisitDate).getTime() < todayTime
    ) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: 'Data nastepnej wizyty jest nieprawidlowa!' });
    }

    const isAdopted = data.status === AnimalStatus.ADOPTOWANY;
    const createData = isAdopted ? { ...data, cageId: null } : data;

    // -- Adoptowane zwierzę nie zajmuje klatki -- //
    if (!isAdopted) {
      const cageCheck = await assertCageAvailable(data.cageId);
      if (!cageCheck.ok) {
        return res.status(cageCheck.status).json({ msg: cageCheck.msg });
      }
    }

    // -- Tworzymy nowe zwierze -- //
    const newAnimal = await prisma.animal.create({
      data: createData,
      select: animalSelect,
    });

    // -- Wysyłamy powiadomienie o nowym zwierzaku -- //
    triggerNewAnimalNotification(newAnimal);

    return res.status(StatusCodes.CREATED).json(mapAnimalDetail(newAnimal));
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera podczas tworzenia!' });
  }
};

// 8. ODZNACZ / ODZNACZ PONOWNIE DZIENNA OPIEKE (JEDZENIE, WODA, SPRZATANIE)
export const updateAnimalDailyCare = async (
  req: AuthRequest,
  res: Response,
) => {
  const animalId = getValidAnimalId(req);

  // -- Jezeli ID nie jest prawidłowe to zwracamy błąd -- //
  if (!animalId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidlowe ID zwierzecia!' });
  }

  // -- Jezeli uzytkownik nie jest zalogowany to zwracamy błąd -- //
  if (!req.userId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Brak tokenu, autoryzacja odmowiona!' });
  }

  // -- Pobieramy pole i wartość z body -- //
  const { field, value } = req.body as {
    field?: DailyCareField;
    value?: boolean;
  };

  // -- Jezeli pole lub wartość nie są prawidłowe to zwracamy błąd -- //
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
      select: {
        id: true,
        status: true,
        cage: { select: { zone: true } },
      },
    });

    // -- Jezeli zwierze nie istnieje to zwracamy błąd -- //
    if (!animal) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Nie znaleziono zwierzecia o podanym ID!' });
    }

    // -- Jezeli zwierze jest adoptowane to zwracamy błąd -- //
    if (animal.status === AnimalStatus.ADOPTOWANY) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nie mozna odznaczac opieki dla adoptowanego zwierzecia.',
      });
    }

    // -- Pracownik moze odznaczac tylko zwierzeta z przypisanej mu strefy -- //
    const zone = animal.cage?.zone;
    if (!zone) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Nie mozna odznaczac opieki dla zwierzecia bez klatki.',
      });
    }

    const { start, end } = getTodayRange();
    const assignment = await prisma.dailyZoneAssignment.findFirst({
      where: {
        workerId: req.userId,
        zone,
        date: { gte: start, lt: end },
      },
      select: { id: true },
    });

    if (!assignment) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Mozesz odznaczac opiekę tylko dla zwierząt z przypisanej Ci strefy.',
      });
    }

    const byIdKey =
      field === 'fed'
        ? 'fedById'
        : field === 'watered'
          ? 'wateredById'
          : 'cleanedById';
    const atKey =
      field === 'fed'
        ? 'fedAt'
        : field === 'watered'
          ? 'wateredAt'
          : 'cleanedAt';

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
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnetrzny blad serwera!' });
  }
};
