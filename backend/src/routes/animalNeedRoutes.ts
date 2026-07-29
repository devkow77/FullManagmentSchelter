import { Router } from 'express';
import {
  getAnimalNeeds,
  createAnimalNeed,
  deleteAnimalNeed,
} from '../controllers/animalNeedControllers';
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
  getAnimalNeeds,
);

router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  createAnimalNeed,
);

router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  deleteAnimalNeed,
);

export default router;
