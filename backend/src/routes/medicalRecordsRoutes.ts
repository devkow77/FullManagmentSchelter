import { Router } from 'express';
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteUniqueMedicalRecord,
} from '../controllers/medicalRecordsControllers';

const router = Router();

router.get('/', getRecords);
router.post('/', createRecord);
router.get('/:id', getRecordById);
router.patch('/:id', updateRecord);
router.delete('/:id', deleteUniqueMedicalRecord);

export default router;
