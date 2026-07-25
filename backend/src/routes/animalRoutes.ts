import { Router } from 'express';
import {
  createAnimal,
  deleteUniqueAnimal,
  getAnimals,
  getAnimalNeedsStatus,
  getDailyCareStatus,
  getUniqueAnimal,
  updateAnimalDailyCare,
  updateUniqueAnimal,
} from '../controllers/animalControllers';
import {
  authenticateUser,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

const router = Router();

router.get('/', getAnimals);
router.get('/daily-care/status', getDailyCareStatus);
router.get('/needs/status', getAnimalNeedsStatus);
router.patch(
  '/:id/daily-care',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  updateAnimalDailyCare,
);
router.get('/:id', getUniqueAnimal);
router.post('/', createAnimal);
router.patch('/:id', updateUniqueAnimal);
router.delete('/:id', deleteUniqueAnimal);

export default router;
