import { StatusCodes } from 'http-status-codes';
import { type Request, type Response } from 'express';
import prisma from '../prisma';
import { formatCageLabel } from '../selects/animal.select';
import type { Prisma } from '../generated/prisma/client';

const DEFAULT_CAGES_PAGE_SIZE = 10;

const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const mapCage = (cage: {
  id: number;
  zone: string;
  number: number;
  animal: {
    id: number;
    name: string;
    type: string;
    imageUrl: string[];
  } | null;
}) => ({
  id: cage.id,
  zone: cage.zone,
  number: cage.number,
  label: formatCageLabel(cage),
  isOccupied: cage.animal !== null,
  animal: cage.animal,
});

const cageSelect = {
  id: true,
  zone: true,
  number: true,
  animal: {
    select: {
      id: true,
      name: true,
      type: true,
      imageUrl: true,
    },
  },
} as const;

const parseCageBody = (body: unknown) => {
  const payload = body as { zone?: unknown; number?: unknown };
  const zone =
    typeof payload?.zone === 'string' ? payload.zone.trim().toUpperCase() : '';
  const number = Number(payload?.number);

  if (!/^[A-Z]$/.test(zone)) {
    return {
      ok: false as const,
      msg: 'Strefa musi być jedną literą (np. A, B, C).',
    };
  }

  if (!Number.isInteger(number) || number < 1 || number > 99) {
    return {
      ok: false as const,
      msg: 'Numer klatki musi być liczbą całkowitą od 1 do 99.',
    };
  }

  return { ok: true as const, zone, number };
};

export const getCageOptions = async (_req: Request, res: Response) => {
  try {
    const cages = await prisma.cage.findMany({
      select: { zone: true, number: true },
      orderBy: [{ zone: 'asc' }, { number: 'asc' }],
    });

    const zones = [...new Set(cages.map((cage) => cage.zone))];
    const numbers = [...new Set(cages.map((cage) => cage.number))].sort(
      (a, b) => a - b,
    );
    const byZone: Record<string, number[]> = {};

    for (const cage of cages) {
      if (!byZone[cage.zone]) {
        byZone[cage.zone] = [];
      }
      byZone[cage.zone].push(cage.number);
    }

    return res.status(StatusCodes.OK).json({
      zones,
      numbers,
      byZone,
    });
  } catch (err) {
    console.error('[getCageOptions]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const getCages = async (req: Request, res: Response) => {
  try {
    const { page, limit, zone, number, available, includeCageId, status } =
      req.query;
    const availableOnly = available === 'true';
    const includeId = Number(includeCageId);

    const where: Prisma.CageWhereInput = {};

    if (availableOnly) {
      where.OR = [
        { animal: null },
        ...(Number.isInteger(includeId) && includeId > 0
          ? [{ id: includeId }]
          : []),
      ];
    } else if (status === 'empty') {
      where.animal = null;
    } else if (status === 'occupied') {
      where.animal = { isNot: null };
    }

    const zoneVals = parseCsvParam(zone).map((z) => z.toUpperCase());
    if (zoneVals.length > 0) {
      where.zone = { in: zoneVals };
    }

    const numberVals = parseCsvParam(number)
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (numberVals.length > 0) {
      where.number = { in: numberVals };
    }

    let pageNumber: number | undefined;
    let pageSize = DEFAULT_CAGES_PAGE_SIZE;

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

      const [cages, total] = await Promise.all([
        prisma.cage.findMany({
          where,
          select: cageSelect,
          orderBy: [{ zone: 'asc' }, { number: 'asc' }],
          take: pageSize,
          skip,
        }),
        prisma.cage.count({ where }),
      ]);

      return res.status(StatusCodes.OK).json({
        data: cages.map(mapCage),
        total,
        page: pageNumber,
        pageSize,
        hasMore: pageNumber * pageSize < total,
      });
    }

    const cages = await prisma.cage.findMany({
      where,
      select: cageSelect,
      orderBy: [{ zone: 'asc' }, { number: 'asc' }],
    });

    return res.status(StatusCodes.OK).json(cages.map(mapCage));
  } catch (err) {
    console.error('[getCages]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const getUniqueCage = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowe ID klatki!' });
  }

  try {
    const cage = await prisma.cage.findUnique({
      where: { id },
      select: cageSelect,
    });

    if (!cage) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Klatka nie istnieje!' });
    }

    return res.status(StatusCodes.OK).json(mapCage(cage));
  } catch (err) {
    console.error('[getUniqueCage]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const createCage = async (req: Request, res: Response) => {
  const parsed = parseCageBody(req.body);
  if (!parsed.ok) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: parsed.msg });
  }

  const { zone, number } = parsed;

  try {
    const conflict = await prisma.cage.findFirst({
      where: { zone, number },
      select: { id: true },
    });

    if (conflict) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: `Klatka ${zone}-${String(number).padStart(2, '0')} już istnieje!`,
      });
    }

    const cage = await prisma.cage.create({
      data: { zone, number },
      select: cageSelect,
    });

    return res.status(StatusCodes.CREATED).json(mapCage(cage));
  } catch (err) {
    console.error('[createCage]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const updateUniqueCage = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowe ID klatki!' });
  }

  const parsed = parseCageBody(req.body);
  if (!parsed.ok) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: parsed.msg });
  }

  const { zone, number } = parsed;

  try {
    const existing = await prisma.cage.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Klatka nie istnieje!' });
    }

    const conflict = await prisma.cage.findFirst({
      where: {
        zone,
        number,
        NOT: { id },
      },
      select: { id: true },
    });

    if (conflict) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: `Klatka ${zone}-${String(number).padStart(2, '0')} już istnieje!`,
      });
    }

    const cage = await prisma.cage.update({
      where: { id },
      data: { zone, number },
      select: cageSelect,
    });

    return res.status(StatusCodes.OK).json(mapCage(cage));
  } catch (err) {
    console.error('[updateUniqueCage]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};

export const deleteUniqueCage = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowe ID klatki!' });
  }

  try {
    const cage = await prisma.cage.findUnique({
      where: { id },
      include: { animal: { select: { id: true } } },
    });

    if (!cage) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Klatka nie istnieje!' });
    }

    if (cage.animal) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Nie można usunąć zajętej klatki. Najpierw przenieś zwierzę.',
      });
    }

    await prisma.cage.delete({ where: { id } });

    return res
      .status(StatusCodes.OK)
      .json({ msg: 'Pomyślnie usunięto klatkę!' });
  } catch (err) {
    console.error('[deleteUniqueCage]', err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wewnętrzny błąd serwera!' });
  }
};
