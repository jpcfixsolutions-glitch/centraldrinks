import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { usuarios } from '../models/schema.js';
import { hashPassword } from '../services/hash.js';

const usuarioSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  nombre: z.string().min(1),
  rol: z.enum(['administrador', 'empleado']).default('empleado'),
});

const usuarioUpdateSchema = usuarioSchema.partial();

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo,
    createdAt: u.createdAt,
  };
}

export async function listar(_req, res) {
  const todos = await db.select().from(usuarios);
  res.json(todos.map(publicUser));
}

export async function crear(req, res) {
  const parsed = usuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const { username, password, nombre, rol } = parsed.data;
  const existente = await db.query.usuarios.findFirst({ where: eq(usuarios.username, username) });
  if (existente) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }
  const passwordHash = await hashPassword(password);
  const [creado] = await db
    .insert(usuarios)
    .values({ username, passwordHash, nombre, rol })
    .returning();
  res.status(201).json(publicUser(creado));
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = usuarioUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const data = parsed.data;
  const update = {};
  if (data.username) update.username = data.username;
  if (data.nombre) update.nombre = data.nombre;
  if (data.rol) update.rol = data.rol;
  if (data.password) update.passwordHash = await hashPassword(data.password);

  const [actualizado] = await db.update(usuarios).set(update).where(eq(usuarios.id, id)).returning();
  if (!actualizado) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(publicUser(actualizado));
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const [borrado] = await db.delete(usuarios).where(eq(usuarios.id, id)).returning();
  if (!borrado) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
}
