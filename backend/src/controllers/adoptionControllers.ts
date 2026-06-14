import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { editAdoptionStatusSchema } from '../validators/adoption.validator';
import {
  adoptionDetailInclude,
  adoptionListInclude,
} from '../selects/adoption.select';

// 1. Pobierz wszystkie adopcje
export const getAdoptions = async (_req: Request, res: Response) => {
  try {
    const adoptions = await prisma.adoption.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: adoptionListInclude,
    });

    return res.status(StatusCodes.OK).json(adoptions);
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};
