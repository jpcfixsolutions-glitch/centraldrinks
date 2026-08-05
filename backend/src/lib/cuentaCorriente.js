export const METODO_CUENTA_CORRIENTE = 'Cuenta corriente';

export function esMetodoCuentaCorriente(nombre) {
  return (nombre || '').trim().toLowerCase() === METODO_CUENTA_CORRIENTE.toLowerCase();
}
