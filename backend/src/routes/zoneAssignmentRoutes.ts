import { Router } from 'express';
import {
  assignZoneRange,
  getCurrentWeekCoverageStatus,
  getWorkersZoneOverview,
} from '../controllers/zoneAssignmentControllers';
import {
  authenticateUser,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

const router = Router();

router.get(
  '/current-week-coverage/status',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  getCurrentWeekCoverageStatus,
);

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
