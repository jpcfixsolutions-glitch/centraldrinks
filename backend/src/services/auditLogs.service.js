import { desc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { auditLogs } from '../models/auditLogs.model.js';

export async function listar(sucursalId, limite = 100) {
  const where = sucursalId != null ? eq(auditLogs.sucursalId, sucursalId) : undefined;
  return db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.fecha)).limit(limite);
}

export async function crear(data, usuarioId, sucursalId) {
  const [nuevo] = await db
    .insert(auditLogs)
    .values({ ...data, usuarioId: usuarioId ?? null, sucursalId: sucursalId ?? null })
    .returning();
  return nuevo;
}
