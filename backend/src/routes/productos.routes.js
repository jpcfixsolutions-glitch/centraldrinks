import { Router } from 'express';
import * as ctrl from '../controllers/productos.controller.js';
import { requireAuth, requireRole, requireSucursal } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);
router.get('/', asyncHandler(ctrl.listar));
router.get('/codbarra/:codbarra', asyncHandler(ctrl.buscarPorCodBarra));
router.post('/', requireRole('administrador'), asyncHandler(ctrl.crear));
router.put('/:id', requireRole('administrador'), asyncHandler(ctrl.actualizar));
router.delete('/:id', requireRole('administrador'), asyncHandler(ctrl.eliminar));

export default router;
