let PESQUEROS_CACHE = null;

let selectedDepartment = null;
let searchTerm = "";

const CANTIDAD_POR_PAGINA = 6;
let cantidadVisible = CANTIDAD_POR_PAGINA;
let recomendadosHoy = [];
let consultaRecomendados = 0;
let temporizadorRecomendados;
let recomendadosVigentesHasta = 0;
let diaRecomendados = '';
let eventosInicializados = false;
let estadoRestaurado = false;
const estadoListado = crearEstadoListado("pesqueros", () => ({
  busqueda: searchTerm,
  filtros: Object.fromEntries(
    [...document.querySelectorAll("#panel-filtros select")].map(select => [select.id, select.value])
  ),
  temporada: document.querySelector('input[name="temporada-filtro"]:checked').value,
  cantidadVisible,
  panelAbierto: !document.getElementById("panel-filtros").hidden
}));


//Cargar pesqueros
async function loadPesqueros() {
     if (PESQUEROS_CACHE) {
    return PESQUEROS_CACHE;
  }
  PESQUEROS_CACHE = await cargarJSON("./data/pesqueros.json");
  if (!Array.isArray(PESQUEROS_CACHE)) {
    PESQUEROS_CACHE = null;
    throw new Error("Formato de pesqueros inválido");
  }
  return PESQUEROS_CACHE;
}

function generarEstrellas(nivel) {
  const llenas = "⭐".repeat(nivel);
  const vacias = "☆".repeat(5 - nivel);

  return llenas + vacias;
}

function renderResults(pesqueros, containerId = "results-container") {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  pesqueros.forEach(p => {
    const card = document.createElement("div");

    card.innerHTML = `
     <a
        href="pesquero.html?id=${p.slug}"
        class="link-pesquero"
    >
    <div class="card-pesquero">

<img src="${p.portada}" alt="Vista de ${p.nombre}" loading="lazy">

      <h3>${p.nombre}</h3>
      <div id="nivel">
      ${generarEstrellas(p.nivel)}
      </div>
      <p>${p.departamento}</p>
    </div>
    </a>
      `;



    container.appendChild(card);
  });
}


function updateResults() {
  const todos = filtrarPesqueros(PESQUEROS_CACHE);

  document.getElementById("results-container").hidden = false;
  mostrarEstadoDatos(mensajeResultados()?.mensaje ?? "");

  renderRecomendados();

  // Todos los pesqueros
  renderResults(
    todos.slice(0, cantidadVisible),
    "results-container"
  );

  document.getElementById("results-count").textContent =
    `${todos.length} pesqueros`;

  document.getElementById("btn-ver-mas").hidden =
    cantidadVisible >= todos.length;
}

function renderRecomendados() {
  if (Date.now() >= recomendadosVigentesHasta || diaRecomendados !== Temporadas.fechaUruguay()) {
    recomendadosHoy = [];
  }
  const recomendados = filtrarPesqueros(recomendadosHoy).slice(0, 3);
  document.getElementById('seccion-recomendados').hidden = recomendados.length === 0;
  renderResults(recomendados, 'recomendados-container');
}


async function init() {

  const [pesqueros, datosEspecies] = await Promise.all([
    loadPesqueros(), cargarJSON("./data/especies.json")
  ]);
  const { especies } = datosEspecies;
  if (!Array.isArray(especies)) throw new Error("Formato de especies inválido");
  for (const id of ["filtro-departamento", "filtro-ambiente", "filtro-especie"]) {
    const select = document.getElementById(id);
    while (select.options.length > 1) select.remove(1);
  }

  PESQUEROS_CACHE = pesqueros;


  const selectDepartamento =
  document.getElementById("filtro-departamento");

  const departamentos = [
  ...new Set(pesqueros.map(p => p.departamento))
];

departamentos.forEach(dep => {
  const option = document.createElement("option");
  option.value = dep;
  option.textContent = dep;
  selectDepartamento.appendChild(option);
});


// Ambientes disponibles
const selectAmbiente = document.getElementById("filtro-ambiente");

const ambientes = [...new Set(
  pesqueros.map(p => p.ambiente).filter(Boolean)
)];

ambientes.sort((a, b) => a.localeCompare(b, "es"));

ambientes.forEach(ambiente => {
  const option = document.createElement("option");
  option.value = ambiente;
  option.textContent = ambiente;
  selectAmbiente.appendChild(option);
});

// Especies presentes en los pesqueros
const selectEspecie = document.getElementById("filtro-especie");

const idsPresentes = new Set(
  pesqueros.flatMap(p => (p.especies ?? []).map(e => e.id))
);

especies
  .filter(e => idsPresentes.has(e.id))
  .sort((a, b) => a.nombre_comun.localeCompare(b.nombre_comun, "es"))
  .forEach(especie => {
    const option = document.createElement("option");
    option.value = especie.id;
    option.textContent = especie.nombre_comun;
    selectEspecie.appendChild(option);
  });


// Abrir y cerrar el panel
const btnFiltro = document.getElementById("btn-filtro");
const panelFiltros = document.getElementById("panel-filtros");

// Restaurar solamente después de generar las opciones dinámicas.
if (!estadoRestaurado) {
  const guardado = estadoListado.guardado;
  document.querySelectorAll("#panel-filtros select").forEach(select => {
    const valor = guardado?.filtros?.[select.id];
    select.value = [...select.options].some(option => option.value === valor) ? valor : "";
  });
  document.querySelectorAll('input[name="temporada-filtro"]').forEach(radio => {
    radio.checked = radio.value === (guardado?.temporada === "24h" ? "24h" : "todos");
  });
  searchTerm = typeof guardado?.busqueda === "string" ? guardado.busqueda : "";
  document.getElementById("search-input").value = searchTerm;
  selectedDepartment = selectDepartamento.value || null;
  cantidadVisible = Number.isSafeInteger(guardado?.cantidadVisible)
    ? Math.max(CANTIDAD_POR_PAGINA, Math.min(guardado.cantidadVisible, Math.max(pesqueros.length, CANTIDAD_POR_PAGINA)))
    : CANTIDAD_POR_PAGINA;
  panelFiltros.hidden = !guardado?.panelAbierto;
  btnFiltro.setAttribute("aria-expanded", String(!panelFiltros.hidden));
  estadoRestaurado = true;
}

if (!eventosInicializados) {
btnFiltro.addEventListener("click", () => {
  panelFiltros.hidden = !panelFiltros.hidden;
  btnFiltro.setAttribute(
    "aria-expanded",
    String(!panelFiltros.hidden)
  );
});

// Aplicar cambios en cualquiera de los filtros
document.querySelectorAll(
  "#panel-filtros select, #panel-filtros input[type='radio']"
).forEach(control => {
  control.addEventListener("change", () => {
    selectedDepartment = selectDepartamento.value || null;
    cantidadVisible = CANTIDAD_POR_PAGINA;
    updateResults();
  });
});

// Restablecer filtros
document.getElementById("btn-limpiar")
  .addEventListener("click", () => {
    document.querySelectorAll("#panel-filtros select")
      .forEach(select => select.value = "");

    document.querySelector(
      'input[name="temporada-filtro"][value="todos"]'
    ).checked = true;

    selectedDepartment = null;
    cantidadVisible = CANTIDAD_POR_PAGINA;
    updateResults();
  });



document.getElementById("search-input")
  .addEventListener("input", e => {
    searchTerm = e.target.value;
    cantidadVisible = CANTIDAD_POR_PAGINA;
    updateResults();
  });

  document.getElementById("btn-ver-mas").addEventListener("click", () => {
    cantidadVisible += CANTIDAD_POR_PAGINA;
    updateResults();
  });
  document.addEventListener('visibilitychange', () => {
    cargarRecomendados(pesqueros, especies);
  });
  window.addEventListener('pageshow', evento => {
    if (evento.persisted) cargarRecomendados(pesqueros, especies);
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(temporizadorRecomendados);
    consultaRecomendados++;
  });
  eventosInicializados = true;
}

  updateResults();
  estadoListado.listo();
  // La lista completa se muestra sin esperar a los servicios meteorológicos.
  cargarRecomendados(pesqueros, especies);
}

async function cargarRecomendados(pesqueros, especies) {
  const consulta = ++consultaRecomendados;
  clearTimeout(temporizadorRecomendados);
  recomendadosHoy = [];
  renderRecomendados();
  if (document.hidden) return;
  const inicio = Date.now();
  const dia = Temporadas.fechaUruguay(new Date(inicio));
  let resultado;
  try {
    resultado = await Recomendaciones.calcular(pesqueros, especies);
  } catch {
    resultado = [];
  }
  if (consulta !== consultaRecomendados) return;
  recomendadosHoy = resultado;
  recomendadosVigentesHasta = inicio + 300000;
  diaRecomendados = dia;
  // Solo se actualiza esta sección: el listado conserva sus nodos y su paginación.
  renderRecomendados();
  // Revalidar cada cinco minutos y al cambiar de hora (incluida medianoche).
  const espera = Math.max(1000, Math.min(recomendadosVigentesHasta - Date.now(),
    3600000 - Date.now() % 3600000));
  temporizadorRecomendados = setTimeout(() => cargarRecomendados(pesqueros, especies), espera);
}



function filtrarPesqueros(lista) {
  const especie = document.getElementById("filtro-especie").value;
  const ambiente = document.getElementById("filtro-ambiente").value;
  const profundidad = document.getElementById("filtro-profundidad").value;
  const enganche = document.getElementById("filtro-enganche").value;

  const solo24h = document.querySelector(
    'input[name="temporada-filtro"]:checked'
  ).value === "24h";

  const termino = searchTerm.trim().toLowerCase();

  return lista.filter(p => {
    const ubicaciones = Array.isArray(p.ubicaciones)
      ? p.ubicaciones
      : [];

    const coincideDepartamento =
      !selectedDepartment || p.departamento === selectedDepartment;

    const coincideBusqueda =
      p.nombre.toLowerCase().includes(termino) ||
      ubicaciones.some(u =>
        (u.nombre ?? "").toLowerCase().includes(termino)
      );

    const coincideEspecie =
      !especie || p.especies?.some(e => e.id === especie);

    const coincideAmbiente =
      !ambiente || p.ambiente === ambiente;

    const coincideProfundidad =
      !profundidad || Number(p.profundidad) >= Number(profundidad);

    const coincideEnganche =
      !enganche || Number(p.enganche) <= Number(enganche);

    const coincideTemporada =
      !solo24h || ubicaciones.some(u => Number(u.restriccion) === 1);

    return coincideDepartamento &&
      coincideBusqueda &&
      coincideEspecie &&
      coincideAmbiente &&
      coincideProfundidad &&
      coincideEnganche &&
      coincideTemporada;
  });
}


function mensajeResultados() {
  if (PESQUEROS_CACHE.length === 0) return { mensaje: "No hay pesqueros disponibles." };
  if (filtrarPesqueros(PESQUEROS_CACHE).length === 0) {
    return { mensaje: "No encontramos pesqueros con esos filtros." };
  }
}

cargarVistaDatos({
  contenido: "#results-container",
  cargando: "Cargando pesqueros...",
  error: "No se pudieron cargar los pesqueros.",
  cargar: async () => {
    await init();
    // Los filtros permanecen visibles incluso cuando no hay coincidencias.
    return mensajeResultados();
  }
});
