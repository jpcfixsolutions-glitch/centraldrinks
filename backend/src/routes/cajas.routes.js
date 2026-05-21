import { Router } from 'express';
import * as ctrl from '../controllers/cajas.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/actual', asyncHandler(ctrl.actual));
router.post('/abrir', requireRole('administrador'), asyncHandler(ctrl.abrir));
router.post('/cerrar', requireRole('administrador'), asyncHandler(ctrl.cerrarCaja));
router.get('/', requireRole('administrador'), asyncHandler(ctrl.listar));
router.get('/:id', requireRole('administrador'), asyncHandler(ctrl.obtener));

export default router;
