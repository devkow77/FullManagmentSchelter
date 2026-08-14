import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { paginate } from '../utils/pagination';
import { type Request, type Response } from 'express';
import {
  AnimalType,
  MedicalRecordStatus,
  MedicalRecordType,
} from '../generated/prisma/enums';
import {
  medicalRecordDetailInclude,
  medicalRecordListInclude,
} from '../selects/medical-record.select';
import { animalIdSelect } from '../selects/animal.select';
import { vetIdSelect } from '../selects/vet.select';
import type { Prisma } from '../generated/prisma/client';
const medicalRecordTypes = Object.values(MedicalRecordType);
const medicalRecordStatuses = Object.values(MedicalRecordStatus);
const DEFAULT_RECORDS_PAGE_SIZE = 10;

const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// 1. Pobierz wszystkie raporty medyczne (z opcjonalną paginacją i filtrami)
export const getRecords = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, animalType, type, status, vetId } = req.query;

    const where: Prisma.MedicalRecordWhereInput = {};

    if (vetId !== undefined) {
      const numericVetId = Number(vetId);
      if (isNaN(numericVetId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Nieprawidłowe ID weterynarza!',
        });
      }
      where.vetId = numericVetId;
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      where.vet = {
        clinic: { contains: search.trim(), mode: 'insensitive' },
      };
    }

    const animalTypeVals = parseCsvParam(animalType).filter((t) =>
      Object.values(AnimalType).includes(t as AnimalType),
    ) as AnimalType[];
    if (animalTypeVals.length > 0) {
      where.animal = { type: { in: animalTypeVals } };
    }

    const typeVals = parseCsvParam(type).filter((t) =>
      medicalRecordTypes.includes(t as MedicalRecordType),
    ) as MedicalRecordType[];
    if (typeVals.length > 0) {
      where.type = { in: typeVals };
    }

    const statusVals = parseCsvParam(status).filter((s) =>
      medicalRecordStatuses.includes(s as MedicalRecordStatus),
    ) as MedicalRecordStatus[];
    if (statusVals.length > 0) {
      where.status = { in: statusVals };
    }

    let pageNumber: number | undefined;
    let pageSize = DEFAULT_RECORDS_PAGE_SIZE;

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

      const [medicalRecords, total] = await Promise.all([
        prisma.medicalRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: medicalRecordListInclude,
          take: pageSize,
          skip,
        }),
        prisma.medicalRecord.count({ where }),
      ]);

      return res
        .status(StatusCodes.OK)
        .json(paginate(medicalRecords, total, pageNumber, pageSize));
    }

    const medicalRecords = await prisma.medicalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: medicalRecordListInclude,
    });

    return res.status(StatusCodes.OK).json(medicalRecords);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 2. Pobierz raport medyczny po ID
export const getRecordById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID raportu medycznego!',
    });
  }

  try {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: {
        id: numericId,
      },
      include: medicalRecordDetailInclude,
    });

    if (!medicalRecord) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Raport medyczny o podanym ID nie został znaleziony!',
      });
    }

    return res.status(StatusCodes.OK).json(medicalRecord);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 3. Stwórz raport medyczny
export const createRecord = async (req: Request, res: Response) => {
  const { vetId, animalId, type, description, date, cost, status } = req.body;

  const numericVetId = Number(vetId);
  const numericAnimalId = Number(animalId);
  const numericCost = Number(cost);

  if (
    !numericVetId ||
    !numericAnimalId ||
    !type ||
    !description ||
    !date ||
    !status ||
    cost === undefined ||
    cost === null ||
    cost === ''
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Wszystkie wymagane pola muszą być wypełnione!',
    });
  }

  if (
    typeof description !== 'string' ||
    description.trim().length < 20
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Opis musi mieć co najmniej 20 znaków!',
    });
  }

  if (!medicalRecordTypes.includes(type)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy typ raportu medycznego!',
    });
  }

  if (!medicalRecordStatuses.includes(status)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy status raportu medycznego!',
    });
  }

  if (Number.isNaN(numericCost) || numericCost < 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Koszt musi być liczbą większą lub równą 0!',
    });
  }

  try {
    const [vet, animal] = await Promise.all([
      prisma.vet.findUnique({
        where: { id: numericVetId },
        select: vetIdSelect,
      }),
      prisma.animal.findUnique({
        where: { id: numericAnimalId },
        select: animalIdSelect,
      }),
    ]);

    if (!vet) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Wybrany weterynarz nie istnieje!',
      });
    }

    if (!animal) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Wybrane zwierzę nie istnieje!',
      });
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        vetId: numericVetId,
        animalId: numericAnimalId,
        type,
        description,
        date: new Date(date),
        cost: numericCost,
        status,
      },
      include: medicalRecordDetailInclude,
    });

    return res.status(StatusCodes.CREATED).json(medicalRecord);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 4. Aktualizuj raport medyczny
export const updateRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { vetId, animalId, type, description, date, cost, status } = req.body;

  const numericId = Number(id);
  const numericVetId = Number(vetId);
  const numericAnimalId = Number(animalId);
  const numericCost = Number(cost);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID raportu medycznego!',
    });
  }

  if (
    !numericVetId ||
    !numericAnimalId ||
    !type ||
    !description ||
    !date ||
    !status ||
    cost === undefined ||
    cost === null ||
    cost === ''
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Wszystkie wymagane pola muszą być wypełnione!',
    });
  }

  if (
    typeof description !== 'string' ||
    description.trim().length < 20
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Opis musi mieć co najmniej 20 znaków!',
    });
  }

  if (!medicalRecordTypes.includes(type)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy typ raportu medycznego!',
    });
  }

  if (!medicalRecordStatuses.includes(status)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy status raportu medycznego!',
    });
  }

  if (Number.isNaN(numericCost) || numericCost < 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Koszt musi być liczbą większą lub równą 0!',
    });
  }

  try {
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: numericId },
    });

    if (!existingRecord) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Raport medyczny o podanym ID nie został znaleziony!',
      });
    }

    const [vet, animal] = await Promise.all([
      prisma.vet.findUnique({
        where: { id: numericVetId },
        select: vetIdSelect,
      }),
      prisma.animal.findUnique({
        where: { id: numericAnimalId },
        select: animalIdSelect,
      }),
    ]);

    if (!vet) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Wybrany weterynarz nie istnieje!',
      });
    }

    if (!animal) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Wybrane zwierzę nie istnieje!',
      });
    }

    const medicalRecord = await prisma.medicalRecord.update({
      where: { id: numericId },
      data: {
        vetId: numericVetId,
        animalId: numericAnimalId,
        type,
        description,
        date: new Date(date),
        cost: numericCost,
        status,
      },
      include: medicalRecordDetailInclude,
    });

    return res.status(StatusCodes.OK).json(medicalRecord);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 5. Usuń raport medyczny
export const deleteUniqueMedicalRecord = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID raportu medycznego!',
    });
  }

  try {
    const existingMedicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: numericId },
    });

    if (!existingMedicalRecord) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Raport medyczny nie istnieje!',
      });
    }

    await prisma.medicalRecord.delete({
      where: { id: numericId },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie usunięto raport medyczny!',
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};
