import * as cierresCajaService from '../services/cierresCaja.service.js';

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
    return res.status(400).json({ error: 'No hay ventas pendientes para cerrar la caja' });
  }

  res.status(201).json(cierre);
}
