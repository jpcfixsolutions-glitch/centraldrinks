import { Router } from 'express';
import * as ctrl from '../controllers/botellasBarra.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(ctrl.listar));
router.post('/', asyncHandler(ctrl.crear));
router.delete('/:id', asyncHandler(ctrl.eliminar));

export default router;
