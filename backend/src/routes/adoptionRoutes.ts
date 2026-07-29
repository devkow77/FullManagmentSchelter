import { Router } from 'express';
import {
  createAdoption,
  getAdoptions,
  getAdoptionById,
  changeAdoptionStatus,
} from '../controllers/adoptionControllers';
import {
  authenticateUser,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

const router = Router();

router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.UZYTKOWNIK),
  createAdoption,
);
router.get(
  '/',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getAdoptions,
);
router.get(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getAdoptionById,
);
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  changeAdoptionStatus,
);

export default router;
