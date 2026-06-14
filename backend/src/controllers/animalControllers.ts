import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import { animalSchema } from '../validators/animal.validator';
import { triggerNewAnimalNotification } from '../services/emailService';
import { AnimalStatus } from '../generated/prisma/enums';
import { animalSelect } from '../selects/animal.select';

// 1. Pobierz wszystkie zwierzęta
export const getAnimals = async (_req: Request, res: Response) => {
  try {
    const animals = await prisma.animal.findMany({
      orderBy: {
        foundAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        gender: true,
        dateOfBirth: true,
        status: true,
        healthStatus: true,
        imageUrl: true,
        traits: true,
      },
    });

    return res.status(StatusCodes.OK).json(animals);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 2. Pobierz zwierzę o podanym id
export const getUniqueAnimal = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID zwierzęcia!',
    });
  }

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: numericId },
    });

    if (!animal) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie ma zwierzęcia z takim id!',
      });
    }

    return res.status(StatusCodes.OK).json(animal);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 3. Zaktualizuj dane zwierzęcia o podanym id
export const updateUniqueAnimal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsedBody = animalSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID zwierzęcia!',
    });
  }

  try {
    const existing = await prisma.animal.findUnique({
      where: { id: numericId },
    });

    if (!existing) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Zwierzę nie istnieje!',
      });
    }

    const today = new Date();

    const foundAt = new Date(parsedBody.data.foundAt);
    const nextVisitDate = new Date(parsedBody.data.nextVisitDate);
    const dateOfBirth = new Date(parsedBody.data.dateOfBirth);

    if (foundAt.getTime() > today.getTime()) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Data znalezienia zwierzęcia jest nieprawidłowa!',
      });
    }

    if (nextVisitDate.getTime() < today.getTime()) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Data następnej wizyty jest nieprawidłowa!',
      });
    }

    if (dateOfBirth.getTime() > today.getTime()) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Data urodzenia zwierzęcia jest nieprawidłowa!',
      });
    }

    const updatedAnimal = await prisma.animal.update({
      where: { id: numericId },
      data: parsedBody.data,
    });

    if (
      existing.status !== AnimalStatus.SZUKA_DOMU &&
      updatedAnimal.status === AnimalStatus.SZUKA_DOMU
    ) {
      triggerNewAnimalNotification(updatedAnimal);
    }

    return res.status(StatusCodes.OK).json(updatedAnimal);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};

// 4. Usuń zwierzę o podanym id
export const deleteUniqueAnimal = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID zwierzęcia!',
    });
  }

  try {
    await prisma.animal.delete({
      where: { id: numericId },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie usunięto zwierzę!',
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Zwierzę nie istnieje!',
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 5. Utwórz nowe zwierzę
export const createAnimal = async (req: Request, res: Response) => {
  const parsedBody = animalSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
      errors: parsedBody.error.issues,
    });
  }

  try {
    const newAnimal = await prisma.animal.create({
      data: parsedBody.data,
    });

    triggerNewAnimalNotification(newAnimal);

    return res.status(StatusCodes.CREATED).json(newAnimal);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas tworzenia!',
    });
  }
};
