import { z } from 'zod';
import * as cierresCajaService from '../services/cierresCaja.service.js';

const abrirSchema = z.object({
  efectivoInicial: z.number().nonnegative(),
});

export async function actual(_req, res) {
  const data = await cierresCajaService.obtenerResumenActual();
  if (!data) {
    return res.json({ abierta: false, sesion: null, resumen: null });
  }
  res.json({ abierta: true, ...data });
}

export async function abrir(req, res) {
  const parsed = abrirSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  try {
    const sesion = await cierresCajaService.abrir(req.user, parsed.data.efectivoInicial);
    const resumen = await cierresCajaService.obtenerResumenActual();
    res.status(201).json({ abierta: true, sesion, resumen: resumen?.resumen });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    throw err;
  }
}

export async function listar(_req, res) {
  res.json(await cierresCajaService.listar());
}

export async function obtener(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const cierre = await cierresCajaService.obtener(id);
  if (!cierre) return res.status(404).json({ error: 'Cierre no encontrado' });
  res.json(cierre);
}

export async function cerrarCaja(req, res) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  const cierre = await cierresCajaService.cerrar(req.user);
  if (!cierre) {
    return res.status(400).json({ error: 'No hay caja abierta para cerrar' });
  }

  res.status(201).json(cierre);
}
