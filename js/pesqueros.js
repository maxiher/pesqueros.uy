let PESQUEROS_CACHE = null;

let selectedDepartment = null;
let searchTerm = "";

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


function getDepartmentStats(pesqueros) {

  const stats = {};

  pesqueros.forEach(p => {
    const dep = p.departamento;   

    if (!stats[dep]) {
      stats[dep] = 0;
    }

    if (Array.isArray(p.ubicaciones)) {
      stats[dep] += p.ubicaciones.length;
    }  else if (p.ubicaciones || p.ubicacion) {
      stats[dep] += 1;
    }
  });

  return stats;
}

function renderDepartments(stats) {
  const container = document.getElementById("grid");

  container.innerHTML = "";

   Object.entries(stats).forEach(([dep, count]) => {
    const card = document.createElement("div");
    card.className = "department-card";
    
    console.log(dep.ubicaciones)

    card.innerHTML = `<h3>🎣${dep}</h3>
    <p>${count} pesqueros</p>
    <a>Explorar ➡️</a>`;

    card.onclick = () => {

  if (selectedDepartment === dep) {
    selectedDepartment = null;
  } else {
    selectedDepartment = dep;
  }

  updateResults();
};

    container.appendChild(card);
  });
}


function generarEstrellas(nivel) {
  const llenas = "⭐".repeat(nivel);
  const vacias = "☆".repeat(5 - nivel);

  return llenas + vacias;
}

function renderResults(pesqueros) {
  const container = document.getElementById("results-container");

  container.innerHTML = "";

  pesqueros.forEach(p => {
    const card = document.createElement("div");   

    card.innerHTML = `
     <a
        href="pesquero.html?id=${p.slug}"
        class="link-pesquero"
    >
    <div class="card-pesquero">
    <img src=${p.portada}>
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

  if (!selectedDepartment && !searchTerm.trim()) {
    document.getElementById("results-container").innerHTML = "";
    return;
  }

  let filtered = [...PESQUEROS_CACHE];

  if (selectedDepartment) {
    filtered = filtered.filter(
      p => p.departamento === selectedDepartment
    );
  }

  if (searchTerm.trim()) {
    filtered = filtered.filter(p =>
      p.nombre.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }


  renderResults(filtered);
}

async function init() {

  const pesqueros = await loadPesqueros();

  PESQUEROS_CACHE = pesqueros;

  const stats = getDepartmentStats(pesqueros);

  renderDepartments(stats);

  updateResults();

  const searchInput =
    document.getElementById("search-input");

  searchInput.addEventListener("input", e => {

    searchTerm = e.target.value;
    updateResults();
  });
}

init();

console.log(selectedDepartment);
console.log(searchTerm)