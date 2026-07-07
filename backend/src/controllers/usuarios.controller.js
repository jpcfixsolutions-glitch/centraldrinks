import { z } from 'zod';
import * as usuariosService from '../services/usuarios.service.js';

const usuarioSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  nombre: z.string().min(1),
  rol: z.enum(['administrador', 'empleado']).default('empleado'),
});

const usuarioUpdateSchema = usuarioSchema.partial();

export async function listar(req, res) {
  res.json(await usuariosService.listar(req.user?.sucursalId ?? null));
}

export async function crear(req, res) {
  const parsed = usuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const existente = await usuariosService.buscarPorUsername(parsed.data.username);
  if (existente) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }

  const creado = await usuariosService.crear(parsed.data, req.user?.sucursalId ?? null);
  res.status(201).json(creado);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = usuarioUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const actualizado = await usuariosService.actualizar(id, parsed.data, req.user?.sucursalId ?? null);
  if (!actualizado) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(actualizado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await usuariosService.eliminar(id, req.user?.sucursalId ?? null);
  if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
}
