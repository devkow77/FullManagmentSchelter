import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { vetSchema } from '../validators/vet.validator';
import { vetIdSelect, vetSelect } from '../selects/vet.select';

export const getVets = async (_req: Request, res: Response) => {
  try {
    const vets = await prisma.vet.findMany({
      orderBy: {
        clinic: 'asc',
      },
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
