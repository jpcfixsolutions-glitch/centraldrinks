import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/suscripcion.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

// Cualquier usuario autenticado puede consultar el estado
router.get('/', asyncHandler(ctrl.obtener));

// Solo el creador puede modificar
router.put('/', requireRole('creador'), asyncHandler(ctrl.actualizar));
router.post('/reactivar', requireRole('creador'), asyncHandler(ctrl.reactivar));

export default router;
