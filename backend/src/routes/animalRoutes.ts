import { Router } from 'express';
import {
  createAnimal,
  deleteUniqueAnimal,
  getAnimals,
  getAnimalNeedsStatus,
  getDailyCareStatus,
  getDailyCareWorkersProgress,
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

router.get('/', getAnimals); // -- Pobieramy wszystkie zwierzeta -- //
router.get(
  '/daily-care/status',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getDailyCareStatus,
); // -- Sprawdza czy w danym dniu nakarmiono wszystkie niezaadoptowane zwierzeta -- //
router.get(
  '/daily-care/workers-progress',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getDailyCareWorkersProgress,
); // -- Postep pracownikow, ile procentowo zostalo zrealizowane klatek na dzis -- //
router.get(
  '/needs/status',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK, Role.ADMINISTRATOR),
  getAnimalNeedsStatus,
); // -- Sprawdza czy zwierze ma aktywne potrzeby -- //
router.patch(
  '/:id/daily-care',
  authenticateUser,
  authorizeRoles(Role.PRACOWNIK),
  updateAnimalDailyCare,
); // -- Odznacza / odznacza ponownie dzienna opieke (jedzenie, woda, sprzatanie) -- //
router.get('/:id', getUniqueAnimal);
router.post(
  '/',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  createAnimal,
); // -- Rejestruje nowe zwierze w systemie -- //
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  updateUniqueAnimal,
); // -- Aktualizuje dane zwierzecia o podanym ID -- //
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(Role.ADMINISTRATOR),
  deleteUniqueAnimal,
); // -- Usuwa zwierze o podanym ID -- //

export default router;
