import { Router } from 'express';
import {
  createCage,
  deleteUniqueCage,
  getCageOptions,
  getCages,
  getUniqueCage,
  updateUniqueCage,
} from '../controllers/cageControllers';
import {
  authenticateUser,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

const router = Router();

router.get(
  '/',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getCages,
);

router.get(
  '/options',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getCageOptions,
);

router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  createCage,
);

router.get(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getUniqueCage,
);

router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  updateUniqueCage,
);

router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  deleteUniqueCage,
);

export default router;
