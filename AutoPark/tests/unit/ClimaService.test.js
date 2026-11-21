const ClimaService = require('../../classes/ClimaService')

describe('ClimaService (integración Open-Meteo, E3-A2) con fetch simulado', () => {
  const original = global.fetch
  afterEach(() => { global.fetch = original })

  test('transforma la respuesta de la API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ current: { temperature_2m: 30, relative_humidity_2m: 70, precipitation: 0, weather_code: 1, time: 't' } })
    })
    const r = await new ClimaService().obtenerClima()
    expect(r).toMatchObject({ ciudad: 'Santo Domingo', temperatura: 30, fuente: 'Open-Meteo' })
  })

  test('lanza error si la API responde mal', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 })
    await expect(new ClimaService().obtenerClima()).rejects.toThrow('503')
  })

  test('lanza error si no vienen datos actuales', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    await expect(new ClimaService().obtenerClima()).rejects.toThrow('No se recibieron')
  })
})
