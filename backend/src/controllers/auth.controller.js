import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { usuarios } from '../models/schema.js';
import { verifyPassword } from '../services/hash.js';
import { signToken } from '../services/jwt.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const { username, password } = parsed.data;

  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.username, username),
  });

  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const ok = await verifyPassword(password, usuario.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = signToken({
    sub: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
  });

  return res.json({
    token,
    user: {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  });
}

export async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, req.user.sub),
  });
  if (!usuario) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }
  return res.json({
    user: {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  });
}
