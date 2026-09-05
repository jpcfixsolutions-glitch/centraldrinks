import { desc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { auditLogs } from '../models/auditLogs.model.js';
import { exigirSucursalId } from '../lib/sucursal.js';

export async function listar(sucursalId, limite = 100) {
  const sedeId = exigirSucursalId(sucursalId);
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.sucursalId, sedeId))
    .orderBy(desc(auditLogs.fecha))
    .limit(limite);
}

export async function crear(data, usuarioId, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const [nuevo] = await db
    .insert(auditLogs)
    .values({ ...data, usuarioId: usuarioId ?? null, sucursalId: sedeId })
    .returning();
  return nuevo;
}
