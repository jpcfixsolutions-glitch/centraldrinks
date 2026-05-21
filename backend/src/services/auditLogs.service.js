import { desc } from 'drizzle-orm';
import { db } from './db.js';
import { auditLogs } from '../models/auditLogs.model.js';

export async function listar(limite = 100) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.fecha)).limit(limite);
}

export async function crear(data, usuarioId) {
  const [nuevo] = await db
    .insert(auditLogs)
    .values({ ...data, usuarioId: usuarioId ?? null })
    .returning();
  return nuevo;
}
