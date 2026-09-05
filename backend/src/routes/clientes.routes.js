import { Router } from 'express';
import * as ctrl from '../controllers/clientes.controller.js';
import { requireAuth, requireSucursal } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth, requireSucursal);
router.get('/', asyncHandler(ctrl.listar));
router.get('/documento/:documento', asyncHandler(ctrl.buscarPorDocumento));
router.post('/', asyncHandler(ctrl.crear));
router.put('/:id', asyncHandler(ctrl.actualizar));

export default router;
