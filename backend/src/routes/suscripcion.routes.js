import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/suscripcion.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

// Solo el creador puede listar y actualizar
router.get('/', requireRole('creador'), asyncHandler(ctrl.listar));
router.put('/', requireRole('creador'), asyncHandler(ctrl.actualizar));

// Cualquier usuario autenticado puede consultar su propia suscripción
router.get('/:sucursalId', asyncHandler(ctrl.obtener));

export default router;
