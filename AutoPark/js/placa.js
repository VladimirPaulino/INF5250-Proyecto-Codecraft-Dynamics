/** Placa sin guiones ni espacios: solo letras y números. */
function normalizarPlacaInput(valor) {
  return String(valor || '').trim().toUpperCase()
}

function validarPlacaInput(valor) {
  const placa = normalizarPlacaInput(valor)
  if (!placa) return { ok: false, error: 'La placa es obligatoria', placa: '' }
  if (/\s/.test(placa) || placa.includes('-')) {
    return { ok: false, error: 'La placa no puede contener guiones ni espacios', placa }
  }
  if (!/^[A-Z0-9]+$/.test(placa)) {
    return { ok: false, error: 'La placa solo puede contener letras y números', placa }
  }
  return { ok: true, placa, error: null }
}
