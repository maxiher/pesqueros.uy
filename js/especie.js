

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

  })
  .catch(error => {
    console.error("Error al cargar la especie:", error);
  });

  