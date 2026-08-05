import { Router } from 'express';
import * as ctrl from '../controllers/clientes.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(ctrl.listar));
router.get('/documento/:documento', asyncHandler(ctrl.buscarPorDocumento));
router.post('/', asyncHandler(ctrl.crear));
router.put('/:id', asyncHandler(ctrl.actualizar));

export default router;
