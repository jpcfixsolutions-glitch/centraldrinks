import { Router } from 'express';
import * as ctrl from '../controllers/mesaCuentas.controller.js';
import { requireAuth, requireSucursal } from '../middleware/auth.js';
import { requireMesaSyncVersion } from '../middleware/mesaSync.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);
router.get('/', asyncHandler(ctrl.listar));
router.put('/:numeroMesa', requireMesaSyncVersion, asyncHandler(ctrl.upsert));
router.delete('/:numeroMesa', requireMesaSyncVersion, asyncHandler(ctrl.eliminar));

export default router;
