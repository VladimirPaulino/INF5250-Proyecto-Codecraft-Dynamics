const { calcularTarifa, obtenerTarifaActiva, TARIFA_DEFECTO } = require('../../classes/TarifaService')

const base = new Date(2026, 10, 18, 10, 0, 0)
const mas = (min) => new Date(base.getTime() + min * 60 * 1000)

describe('TarifaService.calcularTarifa (M10, RF-26 a RF-28)', () => {
  test('carro sin tarifa activa cobra RD$2 por minuto (SRS 2.3)', () => {
    const r = calcularTarifa(base, mas(45), 'carro')
    expect(r.minutos).toBe(45)
    expect(r.unidad).toBe('minuto')
    expect(r.monto).toBe(90)
  })

  test('motocicleta sin tarifa activa cobra RD$1 por minuto', () => {
    expect(calcularTarifa(base, mas(30), 'motocicleta').monto).toBe(30)
  })

  test('mínimo facturable de un minuto', () => {
    expect(calcularTarifa(base, base, 'carro').monto).toBe(2)
    expect(calcularTarifa(base, new Date(base.getTime() + 5000), 'carro').minutos).toBe(1)
  })

  test('fracción de minuto se redondea hacia arriba', () => {
    const r = calcularTarifa(base, new Date(base.getTime() + 61 * 1000), 'carro')
    expect(r.minutos).toBe(2)
    expect(r.monto).toBe(4)
  })

  test('tipo desconocido se trata como carro', () => {
    expect(calcularTarifa(base, mas(10), 'camion').tipo).toBe('carro')
  })

  test('usa la tarifa activa del catálogo cuando existe (por hora)', () => {
    const r = calcularTarifa(base, mas(61), 'carro', { nombre: 'Hora', monto: 60, unidad: 'hora' })
    expect(r.unidades).toBe(2)
    expect(r.monto).toBe(120)
    expect(r.tarifa_nombre).toBe('Hora')
    expect(r.detalle).toBe('2 horas × RD$ 60.00')
  })

  test('ignora una tarifa con monto inválido y aplica la de defecto', () => {
    const r = calcularTarifa(base, mas(3), 'carro', { monto: 0, unidad: 'minuto' })
    expect(r.tarifa_monto).toBe(TARIFA_DEFECTO.carro.monto)
  })

  test('fechas inválidas o salida anterior cobran el mínimo', () => {
    expect(calcularTarifa('no-fecha', base, 'carro').monto).toBe(2)
    expect(calcularTarifa(mas(10), base, 'motocicleta').monto).toBe(1)
  })

  test('acepta fechas en texto', () => {
    expect(calcularTarifa('2026-11-18T10:00:00', '2026-11-18T10:20:00', 'carro').monto).toBe(40)
  })
})

describe('TarifaService.obtenerTarifaActiva', () => {
  test('consulta la tarifa activa del tipo indicado', async () => {
    const calls = {}
    const builder = {
      where(cond) { calls.where = cond; return this },
      orderBy() { return this },
      first: async () => ({ id: 3, monto: 1.5 })
    }
    const db = (tabla) => { calls.tabla = tabla; return builder }
    const r = await obtenerTarifaActiva(db, 'motocicleta')
    expect(calls.tabla).toBe('rates')
    expect(calls.where).toEqual({ tipo_vehiculo: 'motocicleta', activa: true })
    expect(r.id).toBe(3)
  })

  test('devuelve null si no hay tarifa activa', async () => {
    const builder = { where() { return this }, orderBy() { return this }, first: async () => undefined }
    expect(await obtenerTarifaActiva(() => builder, 'carro')).toBeNull()
  })
})
