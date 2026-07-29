import { Router } from 'express';
import {
  createVet,
  deleteVet,
  getVetById,
  getVets,
  updateVet,
} from '../controllers/vetsControllers';
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
  getVets,
);
router.get(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getVetById,
);
router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  createVet,
);
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  updateVet,
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  deleteVet,
);

export default router;
