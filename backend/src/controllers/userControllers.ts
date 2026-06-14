import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { type Request, type Response } from 'express';
import {
  updatePasswordSchema,
  updateUserSchema,
  createUserSchema,
} from '../validators/user.validator';
import bcrypt from 'bcrypt';
import { Role } from '../generated/prisma/enums';
import {
  userDetailSelect,
  userListSelect,
  userPasswordSelect,
  userRoleSelect,
} from '../selects/user.select';

// 1. Aktualizacja hasła
export const updatePassword = async (req: Request, res: Response) => {
  const parsedBody = updatePasswordSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  const userId = req.userId;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: 'Brak tokenu, autoryzacja odmówiona!',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userPasswordSelect,
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie ma takiego użytkownika!',
      });
    }

    const { newPassword, currentPassword } = parsedBody.data;

    const isMatch = await bcrypt.compare(
      currentPassword,
      existingUser.password,
    );

    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: 'Nieprawidłowe obecne hasło!',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nowe hasło musi być inne niż obecne!',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res
      .clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
      .status(StatusCodes.OK)
      .json({ msg: 'Hasło zostało pomyślnie zaktualizowane!' });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 2. Pobierz wszystkich pracowników
export const getWorkers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: Role.UZYTKOWNIK,
        },
      },
      select: userListSelect,
    });

    return res.status(StatusCodes.OK).json(users);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 3. Pobierz wszystkich użytkowników
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: Role.UZYTKOWNIK,
      },
      select: userListSelect,
    });

    return res.status(StatusCodes.OK).json(users);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 4. Pobierz dane użytkownika po id
export const getUniqueUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID użytkownika!',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: numericId },
      select: userDetailSelect,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie ma użytkownika z takim id!',
      });
    }

    return res.status(StatusCodes.OK).json(user);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 5. Zaktualizuj dane użytkownika
export const updateUniqueUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID użytkownika!',
    });
  }

  const parsedBody = updateUserSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  try {
    const today = new Date();
    const dateOfBirth = parsedBody.data.dateOfBirth
      ? new Date(parsedBody.data.dateOfBirth)
      : null;

    if (dateOfBirth && dateOfBirth.getTime() > today.getTime()) {
      return res.status(StatusCodes.CONFLICT).json({
        msg: 'Data urodzenia użytkownika jest nieprawidłowa!',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: numericId },
      data: parsedBody.data,
      select: userDetailSelect,
    });

    return res.status(StatusCodes.OK).json(updatedUser);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas aktualizacji!',
    });
  }
};

// 6. Usuń zwierzę o podanym id
export const deleteUniqueUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowe ID użytkownika!',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: numericId },
      select: userRoleSelect,
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Użytkownik nie istnieje!',
      });
    }

    if (existingUser.role === Role.ADMINISTRATOR) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Nie można usunąć administratora!',
      });
    }

    await prisma.user.delete({
      where: { id: numericId },
    });

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie usunięto użytkownika!',
    });
  } catch (err) {
    console.error(err);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

// 7. Utwórz nowego użytkownika
export const createUser = async (req: Request, res: Response) => {
  const parsedBody = createUserSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
      errors: parsedBody.error.issues,
    });
  }

  try {
    const { password, ...userData } = parsedBody.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: userDetailSelect,
    });

    return res.status(StatusCodes.CREATED).json(newUser);
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera podczas tworzenia!',
    });
  }
};
