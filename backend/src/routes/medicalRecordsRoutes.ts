import { Router } from 'express';
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteUniqueMedicalRecord,
} from '../controllers/medicalRecordsControllers';
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
  getRecords,
);
router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  createRecord,
);
router.get(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getRecordById,
);
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  updateRecord,
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  deleteUniqueMedicalRecord,
);

export default router;
