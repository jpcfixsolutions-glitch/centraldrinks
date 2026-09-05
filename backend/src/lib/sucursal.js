export function exigirSucursalId(valor) {
  const sucursalId = Number(valor);

  if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
    const error = new Error(
      'Tu usuario no tiene una sede válida asignada. Cerrá sesión y contactá al administrador.'
    );
    error.status = 403;
    throw error;
  }

  return sucursalId;
}
