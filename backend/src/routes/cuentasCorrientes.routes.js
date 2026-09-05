import { Router } from 'express';
import * as ctrl from '../controllers/cuentasCorrientes.controller.js';
import { requireAuth, requireSucursal } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);
router.get('/', asyncHandler(ctrl.listar));
router.get('/:clienteId', asyncHandler(ctrl.obtener));
router.post('/:clienteId/pagos', asyncHandler(ctrl.registrarPago));

export default router;
