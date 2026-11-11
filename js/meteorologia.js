const Meteorologia = (() => {
  // Puntos costeros representativos: no describen todo el departamento.
  const zonas = Object.freeze({
    Montevideo: { nombre: 'Rambla de Montevideo', lat: -34.913, lng: -56.162 },
    Canelones: { nombre: 'Atlántida', lat: -34.773, lng: -55.758 },
    Maldonado: { nombre: 'Punta del Este', lat: -34.962, lng: -54.942 },
    Rocha: { nombre: 'La Paloma', lat: -34.664, lng: -54.155 }
  });
  const cache = new Map();
  const vigencia = 5 * 60 * 1000;
  const codigosTormenta = new Set([95, 96, 97, 99]);
  const codigosValidos = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57,
    61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99]);
  const pendientes = [];
  let consultasActivas = 0;

  // Limitar solicitudes simultáneas sin consumir el timeout mientras esperan turno.
  function encolar(consultar) {
    return new Promise((resolve, reject) => {
      pendientes.push({ consultar, resolve, reject });
      procesarCola();
    });
  }

  function procesarCola() {
    while (consultasActivas < 4 && pendientes.length) {
      const tarea = pendientes.shift();
      consultasActivas++;
      Promise.resolve().then(tarea.consultar).then(tarea.resolve, tarea.reject).finally(() => {
        consultasActivas--;
        procesarCola();
      });
    }
  }

  function actualValido(actual, fecha = new Date()) {
    return !!actual && ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'time']
      .every(campo => Number.isFinite(actual[campo])) &&
      Math.abs(actual.time * 1000 - fecha.getTime()) <= 3600000 &&
      actual.wind_speed_10m >= 0 && actual.wind_gusts_10m >= 0 &&
      actual.wind_direction_10m >= 0 && actual.wind_direction_10m <= 360;
  }

  async function consultar(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Coordenadas meteorológicas inválidas');
    }
    const clave = `${lat},${lng}`;
    const ahora = Date.now();
    const anterior = cache.get(clave);
    if (anterior && ahora - anterior.creado < vigencia &&
        anterior.dia === Temporadas.fechaUruguay(new Date(ahora))) return anterior.promesa;

    const entrada = { creado: ahora, dia: Temporadas.fechaUruguay(new Date(ahora)) };
    entrada.promesa = encolar(async () => {
      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), 12000);
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.search = new URLSearchParams({
          latitude: lat, longitude: lng,
          current: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
          hourly: 'weather_code', forecast_days: '1', timeformat: 'unixtime',
          timezone: Temporadas.zonaHoraria, wind_speed_unit: 'kmh'
        });
        const respuesta = await fetch(url, { signal: controlador.signal });
        if (!respuesta.ok) throw new Error(`Open-Meteo: HTTP ${respuesta.status}`);
        const datos = await respuesta.json();
        const actual = datos.current;
        if (!actualValido(actual) || !Number.isFinite(actual.temperature_2m) ||
            !codigosValidos.has(actual.weather_code)) {
          throw new Error('Datos meteorológicos incompletos o desactualizados');
        }
        return datos;
      } finally {
        clearTimeout(temporizador);
      }
    }).catch(error => {
      if (cache.get(clave) === entrada) cache.delete(clave);
      throw error;
    });
    cache.set(clave, entrada);
    return entrada.promesa;
  }

  // null significa que no se pudo verificar TODAS las horas restantes.
  function tormentasRestantes(datos, fecha = new Date()) {
    const horas = datos?.hourly?.time;
    const codigos = datos?.hourly?.weather_code;
    if (!Array.isArray(horas) || !Array.isArray(codigos) || horas.length !== codigos.length ||
        !horas.every(Number.isInteger)) return null;
    const porHora = new Map(horas.map((hora, i) => [hora, codigos[i]]));
    if (porHora.size !== horas.length) return null;
    const dia = Temporadas.fechaUruguay(fecha);
    let tormenta = false;
    // Se incluye la hora en curso para no omitir una tormenta ya prevista.
    for (let hora = Math.floor(fecha.getTime() / 3600000) * 3600;
      Temporadas.fechaUruguay(new Date(hora * 1000)) === dia; hora += 3600) {
      const codigo = porHora.get(hora);
      if (!codigosValidos.has(codigo)) return null;
      if (codigosTormenta.has(codigo)) tormenta = true;
    }
    return tormenta;
  }

  return { zonas, consultar, tormentasRestantes, actualValido };
})();
