import { Router } from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletterControllers';

const router = Router();

router.post('/subscribe', subscribe);
router.get('/unsubscribe/:token', unsubscribe);

export default router;
