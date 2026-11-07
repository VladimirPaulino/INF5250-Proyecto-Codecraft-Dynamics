const TARIFA_HORA = {
  carro: 50,
  motocicleta: 25
}

function normalizarTipo(tipo) {
  return tipo === 'motocicleta' ? 'motocicleta' : 'carro'
}

/**
 * Cobro unificado: horas redondeadas hacia arriba, mínimo 1 hora.
 * Carro RD$50/h, motocicleta RD$25/h.
 */
function calcularTarifa(fechaEntrada, fechaSalida, tipoVehiculo = 'carro') {
  const inicio = fechaEntrada instanceof Date ? fechaEntrada : new Date(fechaEntrada)
  const fin = fechaSalida instanceof Date ? fechaSalida : new Date(fechaSalida)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return { horas: 1, monto: TARIFA_HORA.carro, tarifa_hora: TARIFA_HORA.carro }
  }
  const tipo = normalizarTipo(tipoVehiculo)
  const tarifaHora = TARIFA_HORA[tipo]
  const horas = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)))
  return {
    horas,
    monto: Number((horas * tarifaHora).toFixed(2)),
    tarifa_hora: tarifaHora,
    tipo
  }
}

module.exports = { calcularTarifa, TARIFA_HORA }
