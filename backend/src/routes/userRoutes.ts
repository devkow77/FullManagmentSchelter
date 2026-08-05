import { Router } from 'express';
import {
  createUser,
  deleteUniqueUser,
  getOwnProfile,
  getUniqueUser,
  getUsers,
  getWorkers,
  getWorkerStats,
  updateOwnProfile,
  updatePassword,
  updateUniqueUser,
} from '../controllers/userControllers';
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
  getUsers,
);
router.get(
  '/workers',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getWorkers,
);
router.get(
  '/workers/stats',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  getWorkerStats,
);
router.patch('/password', authenticateUser, updatePassword);
router.get('/me', authenticateUser, getOwnProfile);
router.patch(
  '/me',
  authenticateUser,
  authorizeRoles(Role.UZYTKOWNIK),
  updateOwnProfile,
);
router.get(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getUniqueUser,
);
router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  createUser,
);
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  updateUniqueUser,
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  deleteUniqueUser,
);

export default router;
