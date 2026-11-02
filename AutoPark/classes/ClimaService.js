class ClimaService {
  async obtenerClima() {
    const url = new URL('https://api.open-meteo.com/v1/forecast');

    url.searchParams.set('latitude', '18.4861');
    url.searchParams.set('longitude', '-69.9312');
    url.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,precipitation,weather_code'
    );
    url.searchParams.set('timezone', 'America/Santo_Domingo');

    const respuesta = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    if (!respuesta.ok) {
      throw new Error(`Error de API: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (!datos.current) {
      throw new Error('No se recibieron datos del clima');
    }

    return {
      ciudad: 'Santo Domingo',
      temperatura: datos.current.temperature_2m,
      humedad: datos.current.relative_humidity_2m,
      precipitacion: datos.current.precipitation,
      codigoClima: datos.current.weather_code,
      fechaHora: datos.current.time,
      fuente: 'Open-Meteo'
    };
  }
}

module.exports = ClimaService;