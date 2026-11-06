const contenedor = document.getElementById("contenedor-especies");
const buscador = document.getElementById("search-input");
const botonLimpiar = document.getElementById("btn-limpiar");
let especiesCargadas = null;
let busquedaRestaurada = false;
const estadoListado = crearEstadoListado("especies", () => ({ busqueda: buscador.value }));

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function crearCardEspecie(especie) {
  const card = document.createElement("div");
  card.classList.add("card-especie");
  card.innerHTML = `
    <img
      src="${especie.imagen}"
      alt="${especie.nombre_comun}"
      class="card-especie-img"
    >

    <div class="card-especie-body">
      <h3>${especie.nombre_comun}</h3>

      <p class="nombre-cientifico">
        ${especie.nombre_cientifico}
      </p>

      <p>${especie.habitat}</p>

      <a href="especie.html?id=${especie.id}">
        Ver especie
      </a>
    </div>
  `;
  return card;
}

function renderizarEspecies() {
  if (!especiesCargadas) return;

  const busqueda = normalizarTexto(buscador.value);
  const especiesFiltradas = busqueda
    ? especiesCargadas.filter(especie =>
        normalizarTexto(especie.nombre_comun).includes(busqueda) ||
        normalizarTexto(especie.nombre_cientifico).includes(busqueda)
      )
    : especiesCargadas;

  contenedor.replaceChildren();

  if (especiesFiltradas.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "sin-coincidencias";
    mensaje.setAttribute("role", "status");
    mensaje.textContent = "No encontramos especies que coincidan con tu búsqueda";
    contenedor.appendChild(mensaje);
    return;
  }

  especiesFiltradas.forEach(especie => {
    contenedor.appendChild(crearCardEspecie(especie));
  });
}

function actualizarBusqueda() {
  botonLimpiar.hidden = buscador.value.length === 0;
  renderizarEspecies();
}

buscador.addEventListener("input", actualizarBusqueda);
botonLimpiar.addEventListener("click", () => {
  buscador.value = "";
  actualizarBusqueda();
  buscador.focus();
});

cargarVistaDatos({
  contenido: "#contenedor-especies",
  cargando: "Cargando especies...",
  error: "No se pudieron cargar las especies.",
  cargar: async () => {
    const data = await cargarJSON("./data/especies.json");
    if (!Array.isArray(data.especies)) throw new Error("Formato de datos inválido");
    especiesCargadas = data.especies;
    if (!busquedaRestaurada) {
      buscador.value = typeof estadoListado.guardado?.busqueda === "string"
        ? estadoListado.guardado.busqueda : "";
      busquedaRestaurada = true;
    }
    botonLimpiar.hidden = buscador.value.length === 0;
    contenedor.replaceChildren();
    if (especiesCargadas.length === 0) return { mensaje: "No hay especies disponibles." };
    renderizarEspecies();
    estadoListado.listo();
  }
});

