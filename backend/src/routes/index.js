import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import categoriasRoutes from './categorias.routes.js';
import metodosPagoRoutes from './metodosPago.routes.js';
import productosRoutes from './productos.routes.js';
import mesasRoutes from './mesas.routes.js';
import ventasRoutes from './ventas.routes.js';
import cajasRoutes from './cajas.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/metodos-pago', metodosPagoRoutes);
router.use('/productos', productosRoutes);
router.use('/mesas', mesasRoutes);
router.use('/ventas', ventasRoutes);
router.use('/cajas', cajasRoutes);

export default router;
