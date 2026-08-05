import { z } from 'zod';
import * as clientesService from '../services/clientes.service.js';

const clienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  documento: z.string().min(6),
  telefono: z.string().min(6),
});

const clienteUpdateSchema = clienteSchema.partial().extend({
  activo: z.boolean().optional(),
});

export async function listar(req, res) {
  res.json(await clientesService.listar(req.user?.sucursalId ?? null));
}

export async function buscarPorDocumento(req, res) {
  const cliente = await clientesService.buscarPorDocumento(
    req.params.documento,
    req.user?.sucursalId ?? null
  );
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
}

export async function crear(req, res) {
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  try {
    const creado = await clientesService.crear(parsed.data, req.user?.sucursalId ?? null);
    res.status(201).json(creado);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = clienteUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  try {
    const actualizado = await clientesService.actualizar(
      id,
      parsed.data,
      req.user?.sucursalId ?? null
    );
    if (!actualizado) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(actualizado);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}
