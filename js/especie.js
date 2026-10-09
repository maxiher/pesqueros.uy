

const params = new URLSearchParams(window.location.search);
const idEspecie = params.get("id");

fetch("./data/especies.json")
  .then(response => response.json())
  .then(data => {

    const especie = data.especies.find(
      especie => especie.id === idEspecie
    );

    console.log(especie);

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

    especie.metodos_de_pesca.forEach(metodo => {
      const tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = metodo;

      contenedorMetodos.appendChild(tag);
    });


    const contenedorCarnadas = document.getElementById("carnadas");
    document.getElementById("dieta").textContent =
      especie.caracteristicas.dieta;

    especie.carnadas.forEach(carnada => {
      const tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = carnada;

      contenedorCarnadas.appendChild(tag);
    });

    renderArreglo(especie.arreglo);

  })
  .catch(error => {
    console.error("Error al cargar la especie:", error);
  });


//Renderizado de Arreglo Recomendado


function renderArreglo(arreglo) {
  const section = document.getElementById("arreglo-section");
  const container = document.getElementById("arreglo-container");

  if (!arreglo) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

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
}



