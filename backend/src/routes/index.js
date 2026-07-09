import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import categoriasRoutes from './categorias.routes.js';
import metodosPagoRoutes from './metodosPago.routes.js';
import productosRoutes from './productos.routes.js';
import mesasRoutes from './mesas.routes.js';
import ventasRoutes from './ventas.routes.js';
import cajasRoutes from './cajas.routes.js';
import gastosFijosRoutes from './gastosFijos.routes.js';
import gastosRoutes from './gastos.routes.js';
import botellasBarraRoutes from './botellasBarra.routes.js';
import auditLogsRoutes from './auditLogs.routes.js';
import suscripcionRoutes from './suscripcion.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/metodos-pago', metodosPagoRoutes);
router.use('/productos', productosRoutes);
router.use('/mesas', mesasRoutes);
router.use('/ventas', ventasRoutes);
router.use('/cajas', cajasRoutes);
router.use('/gastos-fijos', gastosFijosRoutes);
router.use('/gastos', gastosRoutes);
router.use('/botellas-barra', botellasBarraRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/suscripcion', suscripcionRoutes);

export default router;
