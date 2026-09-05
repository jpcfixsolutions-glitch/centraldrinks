import { Router } from 'express';
import * as ctrl from '../controllers/mesaCuentas.controller.js';
import { requireAuth, requireSucursal } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);
router.get('/', asyncHandler(ctrl.listar));
router.put('/:numeroMesa', asyncHandler(ctrl.upsert));
router.delete('/:numeroMesa', asyncHandler(ctrl.eliminar));

export default router;
