import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import {
  MedicalRecordStatus,
  MedicalRecordType,
  Role,
} from '../generated/prisma/enums';
import {
  medicalRecordDetailInclude,
  medicalRecordListInclude,
} from '../selects/medical-record.select';
import { animalIdSelect } from '../selects/animal.select';
import { vetIdSelect } from '../selects/vet.select';
import jwt from 'jsonwebtoken';

const medicalRecordTypes = Object.values(MedicalRecordType);
const medicalRecordStatuses = Object.values(MedicalRecordStatus);

// 1. Pobierz wszystkie raporty medyczne
export const getRecords = async (_req: Request, res: Response) => {
  try {
    const medicalRecords = await prisma.medicalRecord.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: medicalRecordListInclude,
    });

    return res.status(StatusCodes.OK).json(medicalRecords);
  } catch (err) {
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
  } catch (err) {
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
    !status
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Wszystkie wymagane pola muszą być wypełnione!',
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
    !status
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Wszystkie wymagane pola muszą być wypełnione!',
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
  const token = req.cookies.token;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID raportu medycznego!',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      userRole: Role;
    };

    if (payload.userRole !== Role.ADMINISTRATOR) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Nie masz uprawnień do usuwania raportów medycznych!',
      });
    }

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
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};
