import { Router } from 'express';
import * as ctrl from '../controllers/gastosFijos.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireRole('administrador'));
router.get('/', asyncHandler(ctrl.listar));
router.post('/', asyncHandler(ctrl.crear));
router.put('/:id', asyncHandler(ctrl.actualizar));
router.delete('/:id', asyncHandler(ctrl.eliminar));

export default router;
