import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatControllers';

const router = Router();

router.post('/message', handleChatMessage);
// Alias zgodny z wcześniejszym endpointem
router.post('/recommend', handleChatMessage);

export default router;
