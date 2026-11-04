

const params = new URLSearchParams(window.location.search);
const idEspecie = params.get("id");

cargarVistaDatos({
  contenido: ".detalle-especie",
  cargando: "Cargando especie...",
  error: "No se pudo cargar la especie.",
  cargar: async () => {
    if (!idEspecie) return { mensaje: "Especie no encontrada.", enlace: "especies.html" };
    const data = await cargarJSON("./data/especies.json");
    if (!Array.isArray(data.especies)) throw new Error("Formato de datos inválido");


    const especie = data.especies.find(
      especie => especie.id === idEspecie
    );

    if (!especie) return { mensaje: "Especie no encontrada.", enlace: "especies.html" };
    const aviso = especie.aviso_pesca;
    const reemplazaArreglo = ["conservacion", "prohibicion"].includes(aviso?.tipo);
    // La dieta se conserva como dato biológico, sin recomendaciones de carnadas.
    for (const id of ["metodos-pesca", "temporada", "interes-gastronomico"]) {
      document.getElementById(id).closest("article").hidden = reemplazaArreglo;
    }
    document.getElementById("carnadas").hidden = reemplazaArreglo;
    document.getElementById("carnadas").closest("article").querySelector("h2").textContent =
      reemplazaArreglo ? "Alimentación" : "Carnadas";
    document.getElementById("metodos-pesca").replaceChildren();
    document.getElementById("carnadas").replaceChildren();

    document.title = `${especie.nombre_comun} | PesquerosUY`;

    const imagen = document.getElementById("imagen-especie");

    imagen.src = especie.imagen;
    imagen.alt = especie.nombre_comun;

    document.getElementById("nombre-especie").textContent = especie.nombre_comun;

    document.getElementById("nombre-cientifico").textContent =
      especie.nombre_cientifico;

    document.getElementById("familia").textContent =
      `Familia: ${especie.familia}`;

    document.getElementById("descripcion").textContent =
      especie.descripcion;

    document.getElementById("habitat").textContent =
      especie.habitat;

    document.getElementById("temporada").textContent =
      especie.temporada;

    document.getElementById("interes-gastronomico").textContent =
      especie.interes_gastronomico;

    document.getElementById("tallas").textContent =
      `Promedio: ${especie.talla_promedio_cm} cm · Máxima: ${especie.talla_maxima_cm} cm`;

    const contenedorMetodos = document.getElementById("metodos-pesca");
    document.getElementById("combatividad").textContent =
      especie.caracteristicas.combatividad;

    if (!reemplazaArreglo) especie.metodos_de_pesca.forEach(metodo => {
      const tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = metodo;

      contenedorMetodos.appendChild(tag);
    });


    const contenedorCarnadas = document.getElementById("carnadas");
    document.getElementById("dieta").textContent =
      especie.caracteristicas.dieta;

    if (!reemplazaArreglo) especie.carnadas.forEach(carnada => {
      const tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = carnada;

      contenedorCarnadas.appendChild(tag);
    });

    renderArreglo(especie.arreglo, aviso, reemplazaArreglo);


  }
});


//Renderizado de Arreglo Recomendado


function renderArreglo(arreglo, aviso, reemplazaArreglo) {
  const section = document.getElementById("arreglo-section");
  const container = document.getElementById("arreglo-container");

  container.replaceChildren();
  section.querySelector("h2").textContent = reemplazaArreglo || (!arreglo && aviso)
    ? "Pesca responsable y conservación"
    : "Arreglo recomendado";

  if (!arreglo && !aviso) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  if (reemplazaArreglo || !arreglo) {
    container.appendChild(crearAvisoPesca(aviso));
    return;
  }

  const datos = [
    ["Línea madre", arreglo.linea_madre],
    ["Chicote", arreglo.chicote],
    ["Anzuelo", arreglo.anzuelo],
    ["Brazolada", `${arreglo.brazolada?.diametro ?? "-"} · ${arreglo.brazolada?.largo ?? "-"}`],
    ["Plomada", `${arreglo.plomada?.tipo ?? "-"} · ${arreglo.plomada?.peso ?? "-"}`]
  ];

  container.innerHTML = `
    <div class="arreglo-contenido">
      <div class="arreglo-datos">
        ${datos.map(([titulo, valor]) => `
          <div class="arreglo-dato">
            <strong>${titulo}</strong>
            <span>${valor ?? "-"}</span>
          </div>
        `).join("")}
      </div>

      <div class="arreglo-imagen">
        <img
          src="${arreglo.imagen}"
          alt="Esquema del arreglo recomendado"
          loading="lazy"
        >
      </div>
    </div>
  `;

  if (aviso) container.prepend(crearAvisoPesca(aviso));
}

function crearAvisoPesca(aviso) {
  const div = document.createElement("div");
  div.className = "aviso-pesca";

  const titulo = document.createElement("h3");
  titulo.textContent = aviso.titulo;
  const mensaje = document.createElement("p");
  mensaje.textContent = aviso.mensaje;
  div.append(titulo, mensaje);

  if (aviso.fuente && aviso.url) {
    const url = new URL(aviso.url, window.location.href);
    if (["https:", "http:"].includes(url.protocol)) {
      const enlace = document.createElement("a");
      enlace.href = url.href;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.textContent = `Fuente: ${aviso.fuente}`;
      div.appendChild(enlace);
    }
  }
  return div;
}


