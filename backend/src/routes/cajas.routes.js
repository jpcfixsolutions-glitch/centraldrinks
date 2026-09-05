import { Router } from 'express';
import * as ctrl from '../controllers/cajas.controller.js';
import { requireAuth, requireRole, requireSucursal } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);

router.get('/actual', asyncHandler(ctrl.actual));
router.post('/abrir', asyncHandler(ctrl.abrir));
router.post('/cerrar', asyncHandler(ctrl.cerrarCaja));
router.get('/', requireRole('administrador'), asyncHandler(ctrl.listar));
router.get('/:id', requireRole('administrador'), asyncHandler(ctrl.obtener));

export default router;
