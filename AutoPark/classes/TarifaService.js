/**
 * M10 · Tarifas (RF-26, RF-27, RF-28).
 *
 * Un solo cálculo de cobro para toda la aplicación. Si hay una tarifa activa
 * en el catálogo (tabla rates) para el tipo de vehículo, se usa esa. Si no,
 * se aplica la regla por defecto de la SRS 2.3: automóvil RD$ 2.00 por minuto,
 * motocicleta RD$ 1.00 por minuto, mínimo un minuto.
 */
const TARIFA_DEFECTO = {
  carro: { nombre: 'Por defecto (SRS 2.3)', monto: 2, unidad: 'minuto' },
  motocicleta: { nombre: 'Por defecto (SRS 2.3)', monto: 1, unidad: 'minuto' }
}

const UNIDADES_MS = {
  minuto: 60 * 1000,
  hora: 60 * 60 * 1000
}

function normalizarTipo(tipo) {
  return tipo === 'motocicleta' ? 'motocicleta' : 'carro'
}

function aFecha(valor) {
  return valor instanceof Date ? valor : new Date(valor)
}

/**
 * Calcula el cobro entre dos fechas.
 * @param {Date|string} fechaEntrada
 * @param {Date|string} fechaSalida
 * @param {'carro'|'motocicleta'} tipoVehiculo
 * @param {{monto:number, unidad:'minuto'|'hora', nombre?:string}|null} tarifa
 *        tarifa activa del catálogo; null usa la regla por defecto.
 */
function calcularTarifa(fechaEntrada, fechaSalida, tipoVehiculo = 'carro', tarifa = null) {
  const tipo = normalizarTipo(tipoVehiculo)
  const regla = tarifa && Number(tarifa.monto) > 0 && UNIDADES_MS[tarifa.unidad]
    ? { nombre: tarifa.nombre || 'Tarifa activa', monto: Number(tarifa.monto), unidad: tarifa.unidad }
    : TARIFA_DEFECTO[tipo]

  const inicio = aFecha(fechaEntrada)
  const fin = aFecha(fechaSalida)
  let duracionMs = fin.getTime() - inicio.getTime()
  if (Number.isNaN(duracionMs) || duracionMs < 0) duracionMs = 0

  const minutos = Math.max(1, Math.ceil(duracionMs / UNIDADES_MS.minuto))
  const unidades = Math.max(1, Math.ceil(duracionMs / UNIDADES_MS[regla.unidad]))
  const monto = Number((unidades * regla.monto).toFixed(2))

  return {
    tipo,
    minutos,
    horas: Math.max(1, Math.ceil(minutos / 60)),
    unidades,
    unidad: regla.unidad,
    tarifa_monto: regla.monto,
    tarifa_nombre: regla.nombre,
    detalle: `${unidades} ${regla.unidad}${unidades === 1 ? '' : 's'} × RD$ ${regla.monto.toFixed(2)}`,
    monto
  }
}

/**
 * Busca la tarifa activa del catálogo para un tipo de vehículo.
 * @param {import('knex').Knex} db conexión o transacción
 */
async function obtenerTarifaActiva(db, tipoVehiculo) {
  const tarifa = await db('rates')
    .where({ tipo_vehiculo: normalizarTipo(tipoVehiculo), activa: true })
    .orderBy('id', 'desc')
    .first()
  return tarifa || null
}

module.exports = { calcularTarifa, obtenerTarifaActiva, TARIFA_DEFECTO }
