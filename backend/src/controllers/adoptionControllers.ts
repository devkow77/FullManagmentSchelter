import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import {
  createAdoptionSchema,
  editAdoptionStatusSchema,
} from '../validators/adoption.validator';
import {
  adoptionDetailInclude,
  adoptionListInclude,
} from '../selects/adoption.select';
import { AdoptionStatus, AnimalStatus, Role } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { triggerAdoptionApplicationConfirmation, triggerAdoptionStatusChangeEmail } from '../services/emailService';
import type { AdoptionStatusEmailKind } from '../templates/emailTemplates';

const DEFAULT_ADOPTIONS_PAGE_SIZE = 10;

const parseCsvParam = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// 0. Utwórz nową adopcję
export const createAdoption = async (req: AuthRequest, res: Response) => {
  const parsedBody = createAdoptionSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  if (!req.userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: 'Brak autoryzacji użytkownika!',
    });
  }

  const { animalId, message } = parsedBody.data;

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: { id: true, status: true, name: true },
    });

    if (!animal) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Zwierzę o podanym ID nie zostało znalezione!',
      });
    }

    if (animal.status !== AnimalStatus.SZUKA_DOMU) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Dla tego zwierzęcia nie można utworzyć adopcji!',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        email: true,
        fullName: true,
        gender: true,
        phoneNumber: true,
        city: true,
        postalCode: true,
        street: true,
        dateOfBirth: true,
        housingType: true,
        livingConditions: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: 'Brak autoryzacji użytkownika!',
      });
    }

    const hasCompleteProfile = Boolean(
      user.fullName?.trim() &&
        user.gender &&
        user.phoneNumber?.trim() &&
        user.city?.trim() &&
        user.postalCode?.trim() &&
        user.street?.trim() &&
        user.dateOfBirth &&
        user.housingType &&
        user.livingConditions?.trim(),
    );

    if (!hasCompleteProfile) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Aby złożyć wniosek o adopcję, uzupełnij najpierw wszystkie dane osobowe w formularzu!',
      });
    }

    const existingAdoption = await prisma.adoption.findFirst({
      where: {
        userId: req.userId,
        animalId,
        status: {
          in: [
            AdoptionStatus.OCZEKUJACA,
            AdoptionStatus.ZAAKCEPTOWANA,
            AdoptionStatus.ODRZUCONA,
          ],
        },
      },
      select: { id: true, status: true },
    });

    if (existingAdoption) {
      if (existingAdoption.status === AdoptionStatus.ODRZUCONA) {
        return res.status(StatusCodes.CONFLICT).json({
          msg: 'Twój poprzedni wniosek o adopcję tego zwierzęcia został odrzucony. Nie możesz złożyć ponownego wniosku.',
        });
      }

      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Masz już aktywny wniosek adopcyjny dla tego zwierzęcia!',
      });
    }

    const adoption = await prisma.adoption.create({
      data: {
        userId: req.userId,
        animalId,
        message,
      },
    });

    triggerAdoptionApplicationConfirmation({
      email: user.email,
      userName: user.fullName,
      animalName: animal.name,
    });

    return res.status(StatusCodes.CREATED).json({
      msg: 'Wniosek adopcyjny został utworzony!',
      id: adoption.id,
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 1. Pobierz wszystkie adopcje (z opcjonalną paginacją i filtrami)
export const getAdoptions = async (req: AuthRequest, res: Response) => {
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

    // Zwykły użytkownik widzi wyłącznie własne wnioski adopcyjne
    if (req.userRole === Role.UZYTKOWNIK) {
      where.userId = req.userId;
    } else if (numericUserId !== undefined) {
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

// 3. Anulowanie własnego oczekującego wniosku przez użytkownika
export const cancelOwnAdoption = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID adopcji!',
    });
  }

  if (!req.userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: 'Brak autoryzacji użytkownika!',
    });
  }

  try {
    const adoption = await prisma.adoption.findUnique({
      where: { id: numericId },
      select: { id: true, userId: true, status: true },
    });

    if (!adoption) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Adopcja o podanym ID nie została znaleziona!',
      });
    }

    if (adoption.userId !== req.userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Możesz anulować tylko własny wniosek adopcyjny!',
      });
    }

    if (adoption.status !== AdoptionStatus.OCZEKUJACA) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Możesz anulować tylko oczekujący wniosek adopcyjny!',
      });
    }

    await prisma.adoption.update({
      where: { id: numericId },
      data: {
        status: AdoptionStatus.ANULOWANA,
        employeeNote: 'Wniosek anulowany przez wnioskodawcę.',
      },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Wniosek adopcyjny został anulowany!',
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 4. Zmiana statusu adopcji
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
        animalId: true,
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        animal: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!findAdoption) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Adopcja nie istnieje!',
      });
    }

    const { status, employeeNote, message } = parsedBody.data;
    const currentStatus = findAdoption.status;

    const allowedTransitions: Record<string, AdoptionStatus[]> = {
      [AdoptionStatus.OCZEKUJACA]: [
        AdoptionStatus.ZAAKCEPTOWANA,
        AdoptionStatus.ODRZUCONA,
        AdoptionStatus.ANULOWANA,
      ],
      [AdoptionStatus.ZAAKCEPTOWANA]: [
        AdoptionStatus.ZAKONCZONA,
        AdoptionStatus.ANULOWANA,
      ],
    };

    const allowedNext = allowedTransitions[currentStatus];

    if (!allowedNext || !allowedNext.includes(status as AdoptionStatus)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Niedozwolona zmiana statusu adopcji!',
      });
    }

    const otherPendingApplicants =
      status === AdoptionStatus.ZAAKCEPTOWANA
        ? await prisma.adoption.findMany({
            where: {
              animalId: findAdoption.animalId,
              status: AdoptionStatus.OCZEKUJACA,
              id: { not: numericId },
            },
            select: {
              user: {
                select: {
                  email: true,
                  fullName: true,
                },
              },
            },
          })
        : [];

    await prisma.$transaction(async (tx) => {
      await tx.adoption.update({
        where: { id: numericId },
        data: {
          status,
          employeeNote,
          message,
          ...(status === AdoptionStatus.ZAAKCEPTOWANA
            ? { acceptedAt: new Date() }
            : {}),
        },
      });

      // Akceptacja wniosku → zaproszenie na spotkanie,
      // zwierzę w trakcie adopcji, pozostałe oczekujące wnioski anulowane
      if (status === AdoptionStatus.ZAAKCEPTOWANA) {
        await tx.animal.update({
          where: { id: findAdoption.animalId },
          data: { status: AnimalStatus.W_TRAKCIE_ADOPCJI },
        });

        await tx.adoption.updateMany({
          where: {
            animalId: findAdoption.animalId,
            status: AdoptionStatus.OCZEKUJACA,
            id: { not: numericId },
          },
          data: {
            status: AdoptionStatus.ANULOWANA,
            employeeNote:
              'Wniosek anulowany automatycznie — dla tego zwierzęcia zaakceptowano inny wniosek adopcyjny.',
          },
        });
      }

      // Finalizacja po spotkaniu → zwierzę adoptowane, zwalnia klatkę
      if (status === AdoptionStatus.ZAKONCZONA) {
        await tx.animal.update({
          where: { id: findAdoption.animalId },
          data: { status: AnimalStatus.ADOPTOWANY, cageId: null },
        });
      }

      // Anulacja po akceptacji (np. nieudane spotkanie) → zwierzę znów szuka domu
      if (
        status === AdoptionStatus.ANULOWANA &&
        currentStatus === AdoptionStatus.ZAAKCEPTOWANA
      ) {
        await tx.animal.update({
          where: { id: findAdoption.animalId },
          data: { status: AnimalStatus.SZUKA_DOMU },
        });
      }
    });

    const resolveEmailKind = (): AdoptionStatusEmailKind => {
      if (status === AdoptionStatus.ZAAKCEPTOWANA) return 'accepted';
      if (status === AdoptionStatus.ODRZUCONA) return 'rejected';
      if (status === AdoptionStatus.ZAKONCZONA) return 'completed';
      if (
        status === AdoptionStatus.ANULOWANA &&
        currentStatus === AdoptionStatus.ZAAKCEPTOWANA
      ) {
        return 'cancelled_after_meeting';
      }
      return 'cancelled';
    };

    triggerAdoptionStatusChangeEmail({
      email: findAdoption.user.email,
      userName: findAdoption.user.fullName,
      animalName: findAdoption.animal.name,
      kind: resolveEmailKind(),
      employeeNote,
    });

    for (const other of otherPendingApplicants) {
      triggerAdoptionStatusChangeEmail({
        email: other.user.email,
        userName: other.user.fullName,
        animalName: findAdoption.animal.name,
        kind: 'cancelled_other_accepted',
        employeeNote:
          'Wniosek anulowany automatycznie — dla tego zwierzęcia zaakceptowano inny wniosek adopcyjny.',
      });
    }

    return res.status(StatusCodes.OK).json({
      msg: 'Adopcja została zaktualizowana!',
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};
