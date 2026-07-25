import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { vetSchema } from '../validators/vet.validator';
import { vetIdSelect, vetSelect } from '../selects/vet.select';
import type { Prisma } from '../generated/prisma/client';

const DEFAULT_VETS_PAGE_SIZE = 10;

const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const getVets = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, clinic } = req.query;

    const where: Prisma.VetWhereInput = {};

    if (typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { clinic: { contains: term, mode: 'insensitive' } },
      ];
    }

    const clinicVals = parseCsvParam(clinic);
    if (clinicVals.length > 0) {
      where.clinic = { in: clinicVals };
    }

    let pageNumber: number | undefined;
    let pageSize = DEFAULT_VETS_PAGE_SIZE;

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

      const [vets, total] = await Promise.all([
        prisma.vet.findMany({
          where,
          select: vetSelect,
          orderBy: { clinic: 'asc' },
          take: pageSize,
          skip,
        }),
        prisma.vet.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: vets,
        total,
        page: pageNumber,
        pageSize,
        hasMore: pageNumber * pageSize < total,
      });
    }

    // Bez paginacji — np. selecty w formularzach rekordów medycznych
    const vets = await prisma.vet.findMany({
      where,
      orderBy: { clinic: 'asc' },
      select: vetSelect,
    });

    return res.status(StatusCodes.OK).json(vets);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

export const getVetById = async (req: Request, res: Response) => {
  const numericId = Number(req.params.id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID weterynarza!',
    });
  }

  try {
    const vet = await prisma.vet.findUnique({
      where: { id: numericId },
      select: vetSelect,
    });

    if (!vet) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie ma weterynarza z takim id!',
      });
    }

    return res.status(StatusCodes.OK).json(vet);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

export const createVet = async (req: Request, res: Response) => {
  const parsedBody = vetSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  try {
    const newVet = await prisma.vet.create({
      data: parsedBody.data,
      select: vetSelect,
    });

    return res.status(StatusCodes.CREATED).json(newVet);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas tworzenia!',
    });
  }
};

export const updateVet = async (req: Request, res: Response) => {
  const numericId = Number(req.params.id);
  const parsedBody = vetSchema.safeParse(req.body);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID weterynarza!',
    });
  }

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  try {
    const existing = await prisma.vet.findUnique({
      where: { id: numericId },
      select: vetIdSelect,
    });

    if (!existing) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Weterynarz nie istnieje!',
      });
    }

    const updatedVet = await prisma.vet.update({
      where: { id: numericId },
      data: parsedBody.data,
      select: vetSelect,
    });

    return res.status(StatusCodes.OK).json(updatedVet);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};

export const deleteVet = async (req: Request, res: Response) => {
  const numericId = Number(req.params.id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID weterynarza!',
    });
  }

  try {
    await prisma.vet.delete({
      where: { id: numericId },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie usunięto weterynarza!',
    });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === 'P2025'
    ) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Weterynarz nie istnieje!',
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};
