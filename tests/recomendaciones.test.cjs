const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function entorno(fetch = () => { throw new Error('No se permiten consultas reales en estas pruebas'); }) {
  const contexto = vm.createContext({ Intl, Date, URL, URLSearchParams, AbortController,
    setTimeout, clearTimeout, fetch });
  for (const archivo of ['temporadas', 'meteorologia', 'recomendaciones']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, `../js/${archivo}.js`), 'utf8'), contexto);
  }
  return vm.runInContext('({ Temporadas, Meteorologia, Recomendaciones })', contexto);
}

const { Temporadas: T, Meteorologia: M, Recomendaciones: R } = entorno();
const fecha = new Date('2026-11-10T18:30:00Z');
const actual = { time: fecha.getTime() / 1000, wind_direction_10m: 135,
  wind_speed_10m: 15, wind_gusts_10m: 25, weather_code: 0 };
const especies = ['a', 'b', 'c'].map(id => ({ id, temporada: ['Primavera', 'Verano'] }));
const pesquero = (id, lat = -34.9, lng = -56.1) => ({ id, nombre: `Pesquero ${id}`,
  departamento: 'Montevideo', ubicaciones: [{ lat, lng }], nivel: 5, mejorViento: 'SE',
  especies: especies.map(e => ({ id: e.id, nivel: 5 })) });
function pronostico(codigo = 0, horaTormenta = 21) {
  const inicio = Date.parse('2026-11-10T03:00:00Z') / 1000;
  return { current: { ...actual }, hourly: {
    time: Array.from({ length: 24 }, (_, i) => inicio + i * 3600),
    weather_code: Array.from({ length: 24 }, (_, i) => i === horaTormenta ? codigo : 0)
  } };
}
const opciones = (tiempo = async () => pronostico()) => ({ fecha, obtenerTiempo: tiempo });

test('estaciones meteorológicas del sur y medianoche de Uruguay', () => {
  const esperadas = ['Verano', 'Verano', 'Otoño', 'Otoño', 'Otoño', 'Invierno',
    'Invierno', 'Invierno', 'Primavera', 'Primavera', 'Primavera', 'Verano'];
  esperadas.forEach((estacion, i) => assert.equal(T.estacion(new Date(Date.UTC(2026, i, 15, 12))), estacion));
  assert.equal(T.estacion(new Date('2026-03-01T01:30:00Z')), 'Verano');
  assert.equal(T.estacion(new Date('2026-03-01T03:00:00Z')), 'Otoño');
  assert.equal(T.fechaUruguay(new Date('2027-01-01T01:00:00Z')), '2026-12-31');
});

test('arreglos, estación única, Todo el año y presentación legible', () => {
  assert.equal(T.enTemporada(['Primavera', 'Verano'], fecha), true);
  assert.equal(T.enTemporada('Invierno', fecha), false);
  assert.equal(T.enTemporada('Todo el año', fecha), true);
  assert.equal(T.enTemporada(null, fecha), false);
  assert.equal(T.texto(['Primavera', 'Verano']), 'Primavera y Verano');
  assert.equal(T.texto('Todo el año'), 'Todo el año');
});

test('datos reales: todas las temporadas son interpretables; no se mutan JSON', () => {
  const datos = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/especies.json'), 'utf8'));
  for (const especie of datos.especies) {
    const valores = Array.isArray(especie.temporada) ? especie.temporada : [especie.temporada];
    assert.ok(valores.every(v => ['Verano', 'Otoño', 'Invierno', 'Primavera', 'Todo el año'].includes(v)));
  }
  const lista = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pesqueros.json'), 'utf8'));
  const antes = JSON.stringify(lista);
  lista.forEach(p => R.puntuar(p, datos.especies, actual, fecha));
  assert.equal(JSON.stringify(lista), antes);
});

test('viento: string, arreglo, direcciones alternativas, intensidad y ráfagas', () => {
  assert.equal(R.puntuarViento('SE', actual), 1);
  assert.equal(R.puntuarViento(['E', 'SE'], actual), 1);
  assert.equal(R.puntuarViento('E / SE', actual), 1);
  assert.equal(R.puntuarViento('NO', actual), 0);
  assert.equal(R.puntuarViento('desconocido', actual), 0);
  assert.equal(R.puntuarViento('SE', { ...actual, wind_speed_10m: 0 }), 0);
  assert.ok(R.puntuarViento('SE', { ...actual, wind_gusts_10m: 40 }) < 1);
  assert.ok(R.puntuarViento('SE', { ...actual, wind_speed_10m: 30 }) < 1);
});

test('pesos 50/30/20, máximo tres especies y exclusión de avisos', () => {
  assert.equal(R.puntuar(pesquero(1), especies, actual, fecha), 100);
  const avisos = ['conservacion', 'prohibicion', 'veda'];
  for (const tipo of avisos) {
    assert.equal(R.puntuar(pesquero(1), especies.map(e => ({ ...e, aviso_pesca: { tipo } })), actual, fecha), null);
  }
  assert.equal(R.puntuar(pesquero(1), especies.map(e => ({ ...e, temporada: 'Invierno' })), actual, fecha), null);
  const uno = { ...pesquero(1), especies: [{ id: 'a', nivel: 5 }] };
  assert.ok(Math.abs(R.puntuar(uno, especies, actual, fecha) - (50 / 3 + 30 + 20)) < 1e-10);
  assert.equal(R.puntuar({ ...pesquero(1), especies: [...pesquero(1).especies, { id: 'd', nivel: 5 }] },
    [...especies, { id: 'd', temporada: 'Todo el año' }], actual, fecha), 100);
});

test('tormentas posteriores, hora actual, pasada, mañana y horas incompletas', () => {
  for (const codigo of [95, 96, 97, 99]) assert.equal(M.tormentasRestantes(pronostico(codigo), fecha), true);
  assert.equal(M.tormentasRestantes(pronostico(95, 15), fecha), true);
  assert.equal(M.tormentasRestantes(pronostico(95, 1), fecha), false);
  const datos = pronostico();
  datos.hourly.time.push(Date.parse('2026-11-11T03:00:00Z') / 1000);
  datos.hourly.weather_code.push(99);
  assert.equal(M.tormentasRestantes(datos, fecha), false);
  datos.hourly.weather_code[23] = null;
  assert.equal(M.tormentasRestantes(datos, fecha), null);
  assert.equal(M.tormentasRestantes({}, fecha), null);
  const desconocido = pronostico();
  desconocido.hourly.weather_code[23] = 4;
  assert.equal(M.tormentasRestantes(desconocido, fecha), null);
  const duplicado = pronostico();
  duplicado.hourly.time.push(duplicado.hourly.time[23]);
  duplicado.hourly.weather_code.push(0);
  assert.equal(M.tormentasRestantes(duplicado, fecha), null);
});

test('fallo de pronóstico excluye solo al candidato sin datos; coordenadas erróneas no se corrigen a ciegas', async () => {
  const resultado = await R.calcular([pesquero(1), pesquero(2, -34.7, -54), pesquero(3, -24, -54)], especies,
    opciones(async (_, lng) => { if (lng === -56.1) throw new Error('Open-Meteo'); return pronostico(); }));
  assert.deepEqual(Array.from(resultado, p => p.id), [2]);
});

test('lluvia intensa y chubascos permiten recomendar sin alterar el puntaje', async () => {
  for (const codigo of [61, 63, 65, 67, 80, 81, 82]) {
    const datos = pronostico(codigo);
    datos.current.weather_code = codigo;
    const resultado = await R.calcular([pesquero(1)], especies, opciones(async () => datos));
    assert.deepEqual(Array.from(resultado, p => p.id), [1], `código ${codigo}`);
    assert.equal(R.puntuar(pesquero(1), especies, datos.current, fecha), 100);
  }
});

test('viento fuerte y ráfagas elevadas reducen afinidad pero no excluyen', async () => {
  const datos = pronostico(65);
  Object.assign(datos.current, { wind_speed_10m: 80, wind_gusts_10m: 120 });
  assert.equal(R.puntuarViento('SE', datos.current), 0);
  assert.equal(R.puntuar(pesquero(1), especies, datos.current, fecha), 70);
  const resultado = await R.calcular([pesquero(1)], especies, opciones(async () => datos));
  assert.deepEqual(Array.from(resultado, p => p.id), [1]);
});

test('cada código 95/96/97/99 excluye incluso si el viento y especies son ideales', async () => {
  for (const codigo of [95, 96, 97, 99]) {
    const resultado = await R.calcular([pesquero(1)], especies, opciones(async () => pronostico(codigo)));
    assert.equal(resultado.length, 0, `código ${codigo}`);
  }
});

test('la exclusión se decide con el pronóstico horario restante', async () => {
  const datos = pronostico();
  datos.current.weather_code = 95;
  assert.equal(M.tormentasRestantes(datos, fecha), false);
  assert.equal((await R.calcular([pesquero(1)], especies, opciones(async () => datos))).length, 1);
  const pasada = pronostico(99, 1);
  assert.equal((await R.calcular([pesquero(1)], especies, opciones(async () => pasada))).length, 1);
});

test('todos excluidos; tormenta local en cualquier punto excluye solo ese pesquero', async () => {
  const lista = [pesquero(1), pesquero(2, -34.7, -54)];
  assert.equal((await R.calcular(lista, especies, opciones(async () => pronostico(95)))).length, 0);
  const resultado = await R.calcular(lista, especies,
    opciones(async (_, lng) => pronostico(lng === -56.1 ? 99 : 0)));
  assert.deepEqual(Array.from(resultado, p => p.id), [2]);
  lista[1].ubicaciones.push({ lat: -34.9, lng: -56.1 });
  assert.equal((await R.calcular(lista, especies,
    opciones(async (_, lng) => pronostico(lng === -56.1 ? 99 : 0)))).length, 0);
});

test('fallo total, horas faltantes, nulos y viento incompleto no generan recomendaciones', async () => {
  assert.equal((await R.calcular([pesquero(1)], especies,
    opciones(async () => { throw new Error('API'); }))).length, 0);
  for (const modificar of [
    datos => { datos.hourly.weather_code[23] = null; },
    datos => { datos.hourly.time.pop(); datos.hourly.weather_code.pop(); },
    datos => { datos.current.wind_speed_10m = null; },
    datos => { datos.current.wind_direction_10m = NaN; },
    datos => { datos.current.wind_gusts_10m = null; },
    datos => { datos.current.time -= 7200; }
  ]) {
    const datos = pronostico(); modificar(datos);
    assert.equal((await R.calcular([pesquero(1)], especies, opciones(async () => datos))).length, 0);
  }
  assert.equal((await R.calcular([pesquero(1)], especies, opciones(async () => null))).length, 0);
});

test('puntos compartidos se consultan una sola vez por cálculo', async () => {
  let llamadas = 0;
  const lista = [pesquero(1), pesquero(2)];
  lista[0].ubicaciones.push({ ...lista[0].ubicaciones[0] });
  const resultado = await R.calcular(lista, especies, opciones(async () => { llamadas++; return pronostico(); }));
  assert.equal(resultado.length, 2);
  assert.equal(llamadas, 1);
});

test('orden descendente sin mutar todos; filtros antes de limitar a tres', async () => {
  const lista = [1, 2, 3, 4, 5].map(id => ({ ...pesquero(id), nivel: id }));
  const orden = lista.map(p => p.id);
  const resultado = await R.calcular(lista, especies, opciones());
  assert.deepEqual(Array.from(resultado, p => p.id), [5, 4, 3, 2, 1]);
  assert.deepEqual(lista.map(p => p.id), orden);
  assert.deepEqual(Array.from(resultado.filter(p => p.id < 4).slice(0, 3), p => p.id), [3, 2, 1]);
  for (const cantidad of [0, 1, 2, 3]) {
    assert.equal(resultado.filter(p => p.id <= cantidad).slice(0, 3).length, cantidad);
  }
});

test('Open-Meteo comparte consultas y caché; recupera errores sin cachearlos', async () => {
  let llamadas = 0;
  let fallar = false;
  const { Meteorologia } = entorno(async url => {
    llamadas++;
    assert.equal(url.searchParams.get('timezone'), 'America/Montevideo');
    assert.equal(url.searchParams.get('hourly'), 'weather_code');
    assert.equal(url.searchParams.get('timeformat'), 'unixtime');
    return { ok: !fallar, status: 503, json: async () => ({ current: { ...actual,
      temperature_2m: 20, time: Date.now() / 1000 } }) };
  });
  await Promise.all([Meteorologia.consultar(-34.9, -56.1), Meteorologia.consultar(-34.9, -56.1)]);
  await Meteorologia.consultar(-34.9, -56.1);
  assert.equal(llamadas, 1);
  fallar = true;
  await assert.rejects(Meteorologia.consultar(-34.7, -54));
  fallar = false;
  await Meteorologia.consultar(-34.7, -54);
  assert.equal(llamadas, 3);
});

test('cola meteorológica limita las consultas simultáneas a cuatro', async () => {
  let activas = 0;
  let maximo = 0;
  const { Meteorologia } = entorno(async () => {
    activas++;
    maximo = Math.max(maximo, activas);
    await new Promise(resolve => setTimeout(resolve, 5));
    activas--;
    return { ok: true, json: async () => ({ current: { ...actual,
      temperature_2m: 20, time: Date.now() / 1000 } }) };
  });
  await Promise.all(Array.from({ length: 12 }, (_, i) => Meteorologia.consultar(-34.9, -56 + i / 100)));
  assert.equal(maximo, 4);
});
