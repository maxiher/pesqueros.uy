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

selectDepartamento.addEventListener("change", e => {
  selectedDepartment = e.target.value || null;
  cantidadVisible = CANTIDAD_POR_PAGINA;
  updateResults();

  });
}


function filtrarPesqueros(lista) {
  return lista.filter(p => {
    const coincideDepartamento =
      !selectedDepartment ||
      p.departamento === selectedDepartment;

    const coincideBusqueda =
      p.nombre.toLowerCase().includes(
        searchTerm.trim().toLowerCase()
      );

    return coincideDepartamento && coincideBusqueda;
  });
}


init();

console.log(selectedDepartment);
console.log(searchTerm)