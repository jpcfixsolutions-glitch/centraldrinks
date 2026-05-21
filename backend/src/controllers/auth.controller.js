import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const result = await authService.login(parsed.data.username, parsed.data.password);
  if (!result) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  return res.json(result);
}

export async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const user = await authService.me(req.user.sub);
  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  return res.json({ user });
}
