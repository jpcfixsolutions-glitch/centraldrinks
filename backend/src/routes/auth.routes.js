import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/login', asyncHandler(authCtrl.login));
router.get('/me', requireAuth, asyncHandler(authCtrl.me));

export default router;
