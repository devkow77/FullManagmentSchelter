import { Router } from 'express';
import {
  getAdoptions,
  getAdoptionById,
  changeAdoptionStatus,
} from '../controllers/adoptionControllers';

const router = Router();

router.get('/', getAdoptions);
router.get('/:id', getAdoptionById);
router.patch('/:id', changeAdoptionStatus);

export default router;
