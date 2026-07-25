import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { editAdoptionStatusSchema } from '../validators/adoption.validator';
import {
  adoptionDetailInclude,
  adoptionListInclude,
} from '../selects/adoption.select';
import { AdoptionStatus } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';

const DEFAULT_ADOPTIONS_PAGE_SIZE = 10;

const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// 1. Pobierz wszystkie adopcje (z opcjonalną paginacją i filtrami)
export const getAdoptions = async (req: Request, res: Response) => {
  const { userId, page, limit, status } = req.query;

  let numericUserId: number | undefined;

  if (userId !== undefined) {
    numericUserId = Number(userId);

    if (isNaN(numericUserId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nieprawidłowe ID użytkownika!',
      });
    }
  }

  try {
    const where: Prisma.AdoptionWhereInput = {};

    if (numericUserId !== undefined) {
      where.userId = numericUserId;
    }

    const statusVals = parseCsvParam(status).filter((s) =>
      Object.values(AdoptionStatus).includes(s as AdoptionStatus),
    ) as AdoptionStatus[];
    if (statusVals.length > 0) {
      where.status = { in: statusVals };
    }

    let pageNumber: number | undefined;
    let pageSize = DEFAULT_ADOPTIONS_PAGE_SIZE;

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

      const [adoptions, total] = await Promise.all([
        prisma.adoption.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: adoptionListInclude,
          take: pageSize,
          skip,
        }),
        prisma.adoption.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: adoptions,
        total,
        page: pageNumber,
        pageSize,
        hasMore: pageNumber * pageSize < total,
      });
    }

    const adoptions = await prisma.adoption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: adoptionListInclude,
    });

    return res.status(StatusCodes.OK).json(adoptions);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 2. Pobierz adopcję po ID
export const getAdoptionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID adopcji!',
    });
  }

  try {
    const adoption = await prisma.adoption.findUnique({
      where: {
        id: numericId,
      },
      include: adoptionDetailInclude,
    });

    if (!adoption) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Adopcja o podanym ID nie została znaleziona!',
      });
    }

    return res.status(StatusCodes.OK).json(adoption);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 3. Zmiana statusu adopcji
export const changeAdoptionStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID adopcji!',
    });
  }

  const parsedBody = editAdoptionStatusSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  try {
    const findAdoption = await prisma.adoption.findUnique({
      where: {
        id: numericId,
      },
      select: {
        status: true,
      },
    });

    if (!findAdoption || findAdoption.status !== 'OCZEKUJACA') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Adopcja nie istnieje lub nie jest w stanie OCZEKUJACA!',
      });
    }

    await prisma.adoption.update({
      where: {
        id: numericId,
      },
      data: parsedBody.data,
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Adopcja została zaktualizowana!',
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};
