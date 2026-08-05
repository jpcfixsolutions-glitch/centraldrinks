import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { clientes } from '../models/clientes.model.js';

function toPublic(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    apellido: c.apellido,
    documento: c.documento,
    telefono: c.telefono,
    sucursalId: c.sucursalId ?? null,
    activo: c.activo,
    createdAt: c.createdAt,
    nombreCompleto: `${c.nombre} ${c.apellido}`.trim(),
  };
}

function normalizarDocumento(documento) {
  return String(documento || '').replace(/\D/g, '');
}

export async function listar(sucursalId) {
  const where = sucursalId != null ? eq(clientes.sucursalId, sucursalId) : undefined;
  const lista = await db.select().from(clientes).where(where);
  return lista.map(toPublic);
}

export async function buscarPorDocumento(documento, sucursalId) {
  const doc = normalizarDocumento(documento);
  if (!doc) return null;

  const condiciones = [eq(clientes.documento, doc)];
  if (sucursalId != null) condiciones.push(eq(clientes.sucursalId, sucursalId));

  const [encontrado] = await db
    .select()
    .from(clientes)
    .where(and(...condiciones))
    .limit(1);

  return encontrado ? toPublic(encontrado) : null;
}

export async function buscarPorId(id, sucursalId) {
  const condiciones = [eq(clientes.id, id)];
  if (sucursalId != null) condiciones.push(eq(clientes.sucursalId, sucursalId));

  const [encontrado] = await db
    .select()
    .from(clientes)
    .where(and(...condiciones))
    .limit(1);

  return encontrado ? toPublic(encontrado) : null;
}

export async function crear(data, sucursalId) {
  const documento = normalizarDocumento(data.documento);
  if (!documento) {
    const err = new Error('Documento inválido');
    err.status = 400;
    throw err;
  }

  const existente = await buscarPorDocumento(documento, sucursalId);
  if (existente) {
    const err = new Error('Ya existe un cliente con ese documento');
    err.status = 409;
    throw err;
  }

  const [creado] = await db
    .insert(clientes)
    .values({
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      documento,
      telefono: String(data.telefono).trim(),
      sucursalId: sucursalId ?? null,
    })
    .returning();

  return toPublic(creado);
}

export async function actualizar(id, data, sucursalId) {
  const update = {};
  if (data.nombre != null) update.nombre = String(data.nombre).trim();
  if (data.apellido != null) update.apellido = String(data.apellido).trim();
  if (data.telefono != null) update.telefono = String(data.telefono).trim();
  if (data.documento != null) {
    const documento = normalizarDocumento(data.documento);
    if (!documento) {
      const err = new Error('Documento inválido');
      err.status = 400;
      throw err;
    }
    const otro = await buscarPorDocumento(documento, sucursalId);
    if (otro && otro.id !== id) {
      const err = new Error('Ya existe un cliente con ese documento');
      err.status = 409;
      throw err;
    }
    update.documento = documento;
  }
  if (data.activo != null) update.activo = data.activo;

  const condiciones = [eq(clientes.id, id)];
  if (sucursalId != null) condiciones.push(eq(clientes.sucursalId, sucursalId));

  const [actualizado] = await db
    .update(clientes)
    .set(update)
    .where(and(...condiciones))
    .returning();

  return actualizado ? toPublic(actualizado) : null;
}
