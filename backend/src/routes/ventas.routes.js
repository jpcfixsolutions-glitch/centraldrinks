import { Router } from 'express';
import * as ctrl from '../controllers/ventas.controller.js';
import { requireAuth, requireSucursal } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);
router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.obtener));
router.post('/', asyncHandler(ctrl.crear));

export default router;
