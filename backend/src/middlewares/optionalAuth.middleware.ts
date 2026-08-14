import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest, JwtPayload } from '../types';

export const optionalAuthenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    req.userId = payload.userId;
    req.userRole = payload.userRole;

    next();
  } catch (err) {
    next();
  }
};
