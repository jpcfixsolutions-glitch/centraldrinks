import { Router } from 'express';
import * as ctrl from '../controllers/cajas.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireRole('administrador'));
router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.obtener));
router.post('/cerrar', asyncHandler(ctrl.cerrarCaja));

export default router;
