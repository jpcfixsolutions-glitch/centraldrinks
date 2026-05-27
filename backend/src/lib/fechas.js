/** SQLite guarda CURRENT_TIMESTAMP en UTC sin indicador de zona. */
export function parseFechaDB(fecha) {
  if (!fecha) return new Date();
  if (fecha instanceof Date) return fecha;

  const valor = String(fecha).trim();
  if (!valor) return new Date();

  if (/[zZ]$/.test(valor) || /[+-]\d{2}:\d{2}$/.test(valor)) {
    return new Date(valor);
  }

  const normalizada = valor.includes('T') ? valor : valor.replace(' ', 'T');
  return new Date(`${normalizada}Z`);
}
