import { Router } from 'express';
import {
  assignZoneRange,
  getWorkersZoneOverview,
} from '../controllers/zoneAssignmentControllers';
import {
  authenticateUser,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

const router = Router();

router.get(
  '/workers-overview',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  getWorkersZoneOverview,
);

router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  assignZoneRange,
);

export default router;
