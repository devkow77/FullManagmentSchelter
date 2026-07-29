import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { Role } from '../generated/prisma/enums';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: Role;
}

// FUNKCJA SPRAWDZAJACA CZY UZYTKOWNIK JEST ZALOGOWANY
export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: 'Brak tokenu, autoryzacja odmówiona!',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      userRole: Role;
    };

    req.userId = payload.userId;
    req.userRole = payload.userRole;

    next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: 'Token jest nieprawidłowy lub wygasł!',
    });
  }
};

// FUNKCJA SPRAWDZAJACA CZY UZYTKOWNIK MA PRAWIDLOWE UPRAWNIENIA
export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: 'Brak uprawnień!',
      });
    }

    next();
  };
};
