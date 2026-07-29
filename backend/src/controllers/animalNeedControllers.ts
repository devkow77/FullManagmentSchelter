import { StatusCodes } from 'http-status-codes';
import { type Request, type Response } from 'express';
import prisma from '../prisma';
import { formatCageLabel } from '../selects/animal.select';
import type { Prisma } from '../generated/prisma/client';
import { AnimalNeedCategory } from '../generated/prisma/enums';

const DEFAULT_PAGE_SIZE = 10;

const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const needInclude = {
  animal: {
    select: {
      id: true,
      name: true,
      type: true,
      imageUrl: true,
      cage: {
        select: {
          zone: true,
          number: true,
        },
      },
    },
  },
  reportedBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
} as const;

const mapNeed = (
  need: Prisma.AnimalNeedGetPayload<{ include: typeof needInclude }>,
) => ({
  id: need.id,
  name: need.name,
  description: need.description,
  category: need.category,
  isActive: need.isActive,
  createdAt: need.createdAt,
  animal: {
    id: need.animal.id,
    name: need.animal.name,
    type: need.animal.type,
    imageUrl: need.animal.imageUrl,
    cageNumber: need.animal.cage ? formatCageLabel(need.animal.cage) : null,
  },
  reportedBy: need.reportedBy
    ? {
        id: need.reportedBy.id,
        fullName: need.reportedBy.fullName,
      }
    : null,
});

export const getAnimalNeeds = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category, isActive, reportedBy } = req.query;

    const where: Prisma.AnimalNeedWhereInput = {};

    if (typeof search === 'string' && search.trim().length > 0) {
      where.animal = {
        name: { contains: search.trim(), mode: 'insensitive' },
      };
    }

    const categoryVals = parseCsvParam(category).filter((value) =>
      Object.values(AnimalNeedCategory).includes(value as AnimalNeedCategory),
    ) as AnimalNeedCategory[];

    if (categoryVals.length > 0) {
      where.category = { in: categoryVals };
    }

    const reportedByIds = parseCsvParam(reportedBy)
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (reportedByIds.length > 0) {
      where.reportedById = { in: reportedByIds };
    }

    if (typeof isActive === 'string' && isActive.length > 0) {
      if (isActive === 'true') where.isActive = true;
      else if (isActive === 'false') where.isActive = false;
      else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr isActive (true|false).',
        });
      }
    } else {
      where.isActive = true;
    }

    let pageNumber: number | undefined;
    let pageSize = DEFAULT_PAGE_SIZE;

    if (typeof page === 'string' && page.length > 0) {
      pageNumber = Number(page);
      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr page (min 1).',
        });
      }
    }

    if (typeof limit === 'string' && limit.length > 0) {
      pageSize = Number(limit);
      if (!Number.isInteger(pageSize) || pageSize < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowy parametr limit.',
        });
      }
      pageSize = Math.min(pageSize, 50);
    }

    if (pageNumber !== undefined) {
      const skip = (pageNumber - 1) * pageSize;
      const [needs, total] = await Promise.all([
        prisma.animalNeed.findMany({
          where,
          include: needInclude,
          orderBy: { createdAt: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.animalNeed.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: needs.map(mapNeed),
        total,
        page: pageNumber,
        pageSize,
        hasMore: pageNumber * pageSize < total,
      });
    }

    const needs = await prisma.animalNeed.findMany({
      where,
      include: needInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(StatusCodes.OK).json(needs.map(mapNeed));
  } catch (err) {
    console.error('[getAnimalNeeds]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

export const createAnimalNeed = async (req: Request, res: Response) => {
  try {
    const { animalId, category, name, description } = req.body;

    if (!animalId || !name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Wymagane pola: animalId, name.',
      });
    }

    const animal = await prisma.animal.findUnique({ where: { id: Number(animalId) } });
    if (!animal) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Nie znaleziono zwierzęcia.' });
    }

    const validCategories = Object.values(AnimalNeedCategory);
    const finalCategory = validCategories.includes(category) ? category : AnimalNeedCategory.INNE;

    const need = await prisma.animalNeed.create({
      data: {
        animalId: Number(animalId),
        category: finalCategory,
        name: name.trim(),
        description: description?.trim() || null,
        reportedById: req.userId ?? null,
      },
      include: needInclude,
    });

    return res.status(StatusCodes.CREATED).json(mapNeed(need));
  } catch (err) {
    console.error('[createAnimalNeed]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

export const deleteAnimalNeed = async (req: Request, res: Response) => {
  try {
    const numericId = Number(req.params.id);

    if (!Number.isInteger(numericId) || numericId < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nieprawidłowe ID zapotrzebowania.',
      });
    }

    const existingNeed = await prisma.animalNeed.findUnique({
      where: { id: numericId },
    });

    if (!existingNeed) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie znaleziono zapotrzebowania.',
      });
    }

    await prisma.animalNeed.update({
      where: { id: numericId },
      data: { isActive: false },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Zapotrzebowanie zostało usunięte.',
    });
  } catch (err) {
    console.error('[deleteAnimalNeed]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};
