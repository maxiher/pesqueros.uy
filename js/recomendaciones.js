const Recomendaciones = (() => {
  const limitar = valor => Math.max(0, Math.min(1, valor));
  const direcciones = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SO: 225, O: 270, NO: 315,
    SW: 225, W: 270, NW: 315 };

  function puntuarViento(mejorViento, actual) {
    if (!actual || !['wind_direction_10m', 'wind_speed_10m', 'wind_gusts_10m']
      .every(campo => Number.isFinite(actual[campo]) && actual[campo] >= 0)) return 0;
    const opciones = (Array.isArray(mejorViento) ? mejorViento : [mejorViento])
      .flatMap(valor => typeof valor === 'string' ? valor.toUpperCase().trim().split(/[\s,;/]+/) : [])
      .filter(valor => Object.hasOwn(direcciones, valor));
    if (!opciones.length) return 0;
    const diferencia = Math.min(...opciones.map(valor => {
      const arco = Math.abs(direcciones[valor] - actual.wind_direction_10m) % 360;
      return Math.min(arco, 360 - arco);
    }));
    const direccion = limitar(1 - diferencia / 90);
    // Heurística de afinidad, no umbrales oficiales de seguridad.
    const intensidad = limitar((40 - actual.wind_speed_10m) / 20);
    const rafagas = limitar((50 - actual.wind_gusts_10m) / 20);
    const calma = limitar(actual.wind_speed_10m / 5);
    return direccion * intensidad * rafagas * calma;
  }

  function puntuar(pesquero, especies, actual, fecha = new Date()) {
    const porId = new Map(especies.map(especie => [especie.id, especie]));
    const mejores = (pesquero.especies ?? []).filter(captura => {
      const especie = porId.get(captura.id);
      // La veda del JSON no tiene fechas/áreas estructuradas: no se infieren del texto.
      return especie && !['conservacion', 'prohibicion', 'veda'].includes(especie.aviso_pesca?.tipo) &&
        Temporadas.enTemporada(especie.temporada, fecha) && Number.isFinite(captura.nivel);
    }).map(captura => limitar(captura.nivel / 5)).sort((a, b) => b - a).slice(0, 3);
    if (!mejores.length) return null;
    // Tres cupos: premia hasta tres especies frecuentes sin favorecer una sola.
    const temporada = mejores.reduce((suma, valor) => suma + valor, 0) / 3;
    const nivel = Number.isFinite(pesquero.nivel) ? limitar(pesquero.nivel / 5) : 0;
    return 100 * (0.5 * temporada + 0.3 * puntuarViento(pesquero.mejorViento, actual) + 0.2 * nivel);
  }

  const coordenadasValidas = punto => Number.isFinite(punto?.lat) && Number.isFinite(punto?.lng) &&
    punto.lat >= -35.2 && punto.lat <= -30 && punto.lng >= -58.5 && punto.lng <= -53;

  async function calcular(pesqueros, especies, {
    obtenerTiempo = Meteorologia.consultar, fecha = new Date()
  } = {}) {
    const consultas = new Map();
    const consultarPunto = punto => {
      const clave = `${punto.lat},${punto.lng}`;
      if (!consultas.has(clave)) {
        consultas.set(clave, Promise.resolve().then(() => obtenerTiempo(punto.lat, punto.lng)));
      }
      return consultas.get(clave);
    };
    const candidatos = await Promise.all(pesqueros.map(async pesquero => {
      const puntos = pesquero.ubicaciones;
      if (!Array.isArray(puntos) || !puntos.length || !puntos.every(coordenadasValidas)) return null;
      try {
        // Verificar todos los puntos; un departamento entero no representa un pesquero.
        const pronosticos = await Promise.all(puntos.map(consultarPunto));
        if (pronosticos.some(datos => Meteorologia.tormentasRestantes(datos, fecha) !== false ||
            !Meteorologia.actualValido(datos.current, fecha))) return null;
        const puntuaciones = pronosticos.map(datos => puntuar(pesquero, especies, datos.current, fecha));
        if (puntuaciones.some(p => p === null)) return null;
        return { pesquero, puntuacion: Math.min(...puntuaciones) };
      } catch { return null; }
    }));
    // Se conserva el conjunto ordenado para filtrar ANTES de limitar a tres.
    return candidatos.filter(Boolean).sort((a, b) => b.puntuacion - a.puntuacion).map(c => c.pesquero);
  }

  return { calcular, puntuar, puntuarViento };
})();
