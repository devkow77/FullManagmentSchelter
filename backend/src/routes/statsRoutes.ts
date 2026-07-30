import { Router } from 'express';
import { getShelterStats } from '../controllers/statsControllers';
import {
  authenticateUser,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

const router = Router();

router.get(
  '/',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  getShelterStats,
);

export default router;
