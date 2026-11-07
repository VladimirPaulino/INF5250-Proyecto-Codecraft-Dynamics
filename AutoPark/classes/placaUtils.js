const { ValidationError } = require('./errors')

/**
 * Placa sin espacios ni guiones: solo letras y números.
 * Ej. válido: MCX5585. Inválido: MCX-5585, MCX 5585.
 */
function normalizarPlaca(placa) {
  return String(placa || '').trim().toUpperCase()
}

function validarPlaca(placa) {
  const valor = normalizarPlaca(placa)
  if (!valor) {
    throw new ValidationError('La placa es obligatoria')
  }
  if (/\s/.test(valor) || valor.includes('-')) {
    throw new ValidationError('La placa no puede contener guiones ni espacios')
  }
  if (!/^[A-Z0-9]+$/.test(valor)) {
    throw new ValidationError('La placa solo puede contener letras y números')
  }
  return valor
}

module.exports = { normalizarPlaca, validarPlaca }
