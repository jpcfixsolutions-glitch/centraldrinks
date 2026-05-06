import { Router } from 'express';
import * as ctrl from '../controllers/mesas.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(ctrl.listar));
router.post('/', requireRole('administrador'), asyncHandler(ctrl.crear));
router.put('/:id', asyncHandler(ctrl.actualizar));
router.delete('/:id', requireRole('administrador'), asyncHandler(ctrl.eliminar));

export default router;
