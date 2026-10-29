let PESQUEROS_CACHE = null;

let selectedDepartment = null;
let searchTerm = "";

const CANTIDAD_POR_PAGINA = 6;
let cantidadVisible = CANTIDAD_POR_PAGINA;
let recomendadosHoy = [];


//Cargar pesqueros
async function loadPesqueros() {
     if (PESQUEROS_CACHE) {
    return PESQUEROS_CACHE;
  }
      const res = await fetch("./data/pesqueros.json");

  if (!res.ok) {
    throw new Error("Error cargando JSON: " + res.status);
    }

    PESQUEROS_CACHE = await res.json();
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
  const recomendados = filtrarPesqueros(recomendadosHoy);

  // Recomendados
  const seccion = document.getElementById("seccion-recomendados");

  seccion.hidden = recomendados.length === 0;

  renderResults(
    recomendados.slice(0, 6),
    "recomendados-container"
  );

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



async function init() {

  const pesqueros = await loadPesqueros();

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
const resEspecies = await fetch("./data/especies.json");
if (!resEspecies.ok) {
  throw new Error("No se pudo cargar especies.json");
}

const { especies } = await resEspecies.json();
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

  updateResults();
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


init();

console.log(selectedDepartment);
console.log(searchTerm)