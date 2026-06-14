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

router.get('/', getVets);
router.get('/:id', authenticateUser, getVetById);
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
