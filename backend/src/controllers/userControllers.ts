import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import {
  updatePasswordSchema,
  updateUserSchema,
  createUserSchema,
} from '../validators/user.validator';
import bcrypt from 'bcrypt';
import { Gender, Role, AdoptionStatus } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';
import {
  userDetailSelect,
  userListSelect,
  userPasswordSelect,
  userRoleSelect,
} from '../selects/user.select';

const DEFAULT_WORKERS_PAGE_SIZE = 10;
const WORKER_ROLES = [Role.ADMINISTRATOR, Role.PRACOWNIK] as const;

// FUNKCJA PARSUJACA Z STRINGA NA TABLICE
const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// FUNKCJA PARSUJACA Z STRINGA NA SET BOOLEANÓW
const parseBooleanList = (value: unknown) => {
  const items = parseCsvParam(value);
  const booleans: boolean[] = [];

  for (const item of items) {
    if (item === 'true') booleans.push(true);
    else if (item === 'false') booleans.push(false);
  }

  return [...new Set(booleans)];
};

// 1. AKTUALIZACJA HASŁA
export const updatePassword = async (req: Request, res: Response) => {
  const parsedBody = updatePasswordSchema.safeParse(req.body);

  // -- Jezeli walidacja nie powiodła się to zwracamy błąd -- //
  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  const userId = req.userId;

  // -- Jezeli uzytkownik nie jest zalogowany to zwracamy błąd -- //
  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: 'Brak tokenu, autoryzacja odmówiona!',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userPasswordSelect,
    });

    // -- Jezeli uzytkownik nie istnieje to zwracamy błąd -- //
    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie ma takiego użytkownika!',
      });
    }

    const { newPassword, currentPassword } = parsedBody.data;

    // -- Sprawdzamy czy hasło jest poprawne -- //
    const isMatch = await bcrypt.compare(
      currentPassword,
      existingUser.password,
    );

    // -- Jezeli hasło nie jest poprawne to zwracamy błąd -- //
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: 'Nieprawidłowe obecne hasło!',
      });
    }

    // -- Sprawdzamy czy nowe hasło jest inne niż obecne -- //
    if (currentPassword === newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nowe hasło musi być inne niż obecne!',
      });
    }

    // -- Hashujemy nowe hasło -- //
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // -- Aktualizujemy hasło uzytkownika -- //
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res
      .clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
      .status(StatusCodes.OK)
      .json({ msg: 'Hasło zostało pomyślnie zaktualizowane!' });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 2. Pobierz wszystkich pracowników (z opcjonalną paginacją i filtrami)
export const getWorkers = async (req: Request, res: Response) => {
  try {
    // -- Parametry z query stringa (np. ?page=1&search=Jan&role=ADMINISTRATOR) -- //
    const {
      page,
      limit,
      search,
      role,
      gender,
      city,
      hasChildren,
      isFormFilled,
    } = req.query;

    // -- Bazowy filtr: tylko pracownicy i administratorzy (bez zwykłych użytkowników) -- //
    const where: Prisma.UserWhereInput = {
      role: { not: Role.UZYTKOWNIK },
    };

    // -- Wyszukiwanie po imieniu i nazwisku (bez rozróżniania wielkości liter) -- //
    if (typeof search === 'string' && search.trim().length > 0) {
      where.fullName = { contains: search.trim(), mode: 'insensitive' };
    }

    // -- Filtr roli: CSV z query, tylko dozwolone role pracownicze -- //
    const roleVals = parseCsvParam(role).filter((r) =>
      (WORKER_ROLES as readonly string[]).includes(r),
    ) as Role[];
    if (roleVals.length > 0) {
      where.role = { in: roleVals };
    }

    // -- Filtr płci: CSV, tylko wartości z enuma Gender -- //
    const genderVals = parseCsvParam(gender).filter((g) =>
      Object.values(Gender).includes(g as Gender),
    ) as Gender[];
    if (genderVals.length > 0) {
      where.gender = { in: genderVals };
    }

    // -- Filtr miasta: CSV z nazwami miast -- //
    const cityVals = parseCsvParam(city);
    if (cityVals.length > 0) {
      where.city = { in: cityVals };
    }

    // -- Filtr hasChildren: stosujemy tylko gdy wybrano dokładnie jedną wartość (true LUB false) -- //
    const hasChildrenVals = parseBooleanList(hasChildren);
    if (hasChildrenVals.length === 1) {
      where.hasChildren = hasChildrenVals[0];
    }

    // -- Filtr isFormFilled: j.w. — obie wartości naraz = brak filtra -- //
    const isFormFilledVals = parseBooleanList(isFormFilled);
    if (isFormFilledVals.length === 1) {
      where.isFormFilled = isFormFilledVals[0];
    }

    // -- Paginacja: page i limit są opcjonalne -- //
    let pageNumber: number | undefined;
    let pageSize = DEFAULT_WORKERS_PAGE_SIZE;

    // -- Walidacja page: musi być dodatnią liczbą całkowitą -- //
    if (typeof page === 'string' && page.length > 0) {
      pageNumber = Number(page);
      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr page!',
        });
      }
    }

    // -- Walidacja limit: max 50 rekordów na stronę -- //
    if (typeof limit === 'string' && limit.length > 0) {
      const parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr limit!',
        });
      }
      pageSize = Math.min(parsedLimit, 50);
    }

    // -- Z paginacją (gdy podano page) — lista admina: dane + total + hasMore -- //
    if (pageNumber !== undefined) {
      const skip = (pageNumber - 1) * pageSize;

      // -- Równolegle: strona wyników + łączna liczba pasujących rekordów -- //
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: userListSelect,
          orderBy: { createdAt: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: users,
        total,
        page: pageNumber,
        pageSize,
        hasMore: pageNumber * pageSize < total,
      });
    }

    // -- Bez paginacji — pełna lista (np. do selectów / statystyk) -- //
    const users = await prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(StatusCodes.OK).json(users);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

const POLISH_MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
] as const;

export const getWorkerStats = async (_req: Request, res: Response) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: { not: Role.UZYTKOWNIK } },
      select: {
        id: true,
        fullName: true,
        role: true,
        gender: true,
        isFormFilled: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const now = new Date();
    const months: { key: string; month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const key = `${year}-${date.getMonth()}`;
      months.push({
        key,
        month: `${POLISH_MONTHS[date.getMonth()]!} ${year}`,
        count: 0,
      });
    }

    const monthIndex = new Map(months.map((item, index) => [item.key, index]));
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    for (const worker of workers) {
      if (worker.createdAt < windowStart) continue;
      const key = `${worker.createdAt.getFullYear()}-${worker.createdAt.getMonth()}`;
      const index = monthIndex.get(key);
      if (index !== undefined) {
        months[index]!.count += 1;
      }
    }

    const processedCounts = await prisma.adoption.groupBy({
      by: ['processedById'],
      where: {
        processedById: { not: null },
        status: {
          in: [
            AdoptionStatus.ZAAKCEPTOWANA,
            AdoptionStatus.ODRZUCONA,
            AdoptionStatus.ANULOWANA,
            AdoptionStatus.ZAKONCZONA,
          ],
        },
      },
      _count: { _all: true },
    });

    const processedByWorker = new Map(
      processedCounts
        .filter((item) => item.processedById !== null)
        .map((item) => [item.processedById!, item._count._all]),
    );

    const adoptionActivity = workers
      .map((worker) => ({
        name: worker.fullName,
        adoptions: processedByWorker.get(worker.id) ?? 0,
      }))
      .filter((item) => item.adoptions > 0)
      .sort((a, b) => b.adoptions - a.adoptions)
      .slice(0, 8);

    const administrators = workers.filter(
      (worker) => worker.role === Role.ADMINISTRATOR,
    ).length;
    const employees = workers.filter(
      (worker) => worker.role === Role.PRACOWNIK,
    ).length;
    const men = workers.filter(
      (worker) => worker.gender === Gender.MEZCZYZNA,
    ).length;
    const women = workers.filter(
      (worker) => worker.gender === Gender.KOBIETA,
    ).length;

    const twoFactorEnabled = workers.filter(
      (worker) => worker.twoFactorEnabled,
    ).length;
    const twoFactorPercent =
      workers.length > 0
        ? Math.round((twoFactorEnabled / workers.length) * 100)
        : 0;

    return res.status(StatusCodes.OK).json({
      totals: {
        total: workers.length,
        administrators,
        employees,
        twoFactorEnabled,
        twoFactorPercent,
        men,
        women,
      },
      newWorkersByMonth: months.map(({ month, count }) => ({ month, count })),
      roleDistribution: [
        { role: 'pracownicy', value: employees },
        { role: 'administratorzy', value: administrators },
      ],
      genderDistribution: [
        { gender: 'mezczyzni', value: men },
        { gender: 'kobiety', value: women },
      ],
      adoptionActivity,
    });
  } catch (err) {
    console.error('[getWorkerStats]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 3. Pobierz wszystkich użytkowników (z opcjonalną paginacją i filtrami)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, gender, city, isBanned, isFormFilled } =
      req.query;

    const where: Prisma.UserWhereInput = {
      role: Role.UZYTKOWNIK,
    };

    if (typeof search === 'string' && search.trim().length > 0) {
      where.fullName = { contains: search.trim(), mode: 'insensitive' };
    }

    const genderVals = parseCsvParam(gender).filter((g) =>
      Object.values(Gender).includes(g as Gender),
    ) as Gender[];
    if (genderVals.length > 0) {
      where.gender = { in: genderVals };
    }

    const cityVals = parseCsvParam(city);
    if (cityVals.length > 0) {
      where.city = { in: cityVals };
    }

    const isBannedVals = parseBooleanList(isBanned);
    if (isBannedVals.length === 1) {
      where.isBanned = isBannedVals[0];
    }

    const isFormFilledVals = parseBooleanList(isFormFilled);
    if (isFormFilledVals.length === 1) {
      where.isFormFilled = isFormFilledVals[0];
    }

    let pageNumber: number | undefined;
    let pageSize = DEFAULT_WORKERS_PAGE_SIZE;

    if (typeof page === 'string' && page.length > 0) {
      pageNumber = Number(page);
      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr page!',
        });
      }
    }

    if (typeof limit === 'string' && limit.length > 0) {
      const parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr limit!',
        });
      }
      pageSize = Math.min(parsedLimit, 50);
    }

    if (pageNumber !== undefined) {
      const skip = (pageNumber - 1) * pageSize;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: userListSelect,
          orderBy: { createdAt: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: users,
        total,
        page: pageNumber,
        pageSize,
        hasMore: pageNumber * pageSize < total,
      });
    }

    const users = await prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(StatusCodes.OK).json(users);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 4. Pobierz dane użytkownika po id
export const getUniqueUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID użytkownika!',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: numericId },
      select: userDetailSelect,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie ma użytkownika z takim id!',
      });
    }

    return res.status(StatusCodes.OK).json(user);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 5. Zaktualizuj dane użytkownika
export const updateUniqueUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID użytkownika!',
    });
  }

  const parsedBody = updateUserSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  try {
    const today = new Date();
    const dateOfBirth = parsedBody.data.dateOfBirth
      ? new Date(parsedBody.data.dateOfBirth)
      : null;

    if (dateOfBirth && dateOfBirth.getTime() > today.getTime()) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Data urodzenia użytkownika jest nieprawidłowa!',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: numericId },
      data: parsedBody.data,
      select: userDetailSelect,
    });

    return res.status(StatusCodes.OK).json(updatedUser);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};

// 6. Usuń zwierzę o podanym id
export const deleteUniqueUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID użytkownika!',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: numericId },
      select: userRoleSelect,
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Użytkownik nie istnieje!',
      });
    }

    if (existingUser.role === Role.ADMINISTRATOR) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Nie można usunąć administratora!',
      });
    }

    await prisma.user.delete({
      where: { id: numericId },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie usunięto użytkownika!',
    });
  } catch (err) {
    console.error(err);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 7. Utwórz nowego użytkownika
export const createUser = async (req: Request, res: Response) => {
  const parsedBody = createUserSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
      errors: parsedBody.error.issues,
    });
  }

  try {
    const { password, ...userData } = parsedBody.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: userDetailSelect,
    });

    return res.status(StatusCodes.CREATED).json(newUser);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas tworzenia!',
    });
  }
};
