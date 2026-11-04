const contenedor = document.getElementById("contenedor-especies");

cargarVistaDatos({
  contenido: "#contenedor-especies",
  cargando: "Cargando especies...",
  error: "No se pudieron cargar las especies.",
  cargar: async () => {
    const data = await cargarJSON("./data/especies.json");
    if (!Array.isArray(data.especies)) throw new Error("Formato de datos inválido");
    contenedor.replaceChildren();
    if (data.especies.length === 0) return { mensaje: "No hay especies disponibles." };
    data.especies.forEach(especie => {
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

          <p>
            ${especie.habitat}
          </p>

          <a href="especie.html?id=${especie.id}">
            Ver especie
          </a>
        </div>
      `

      ;

      contenedor.appendChild(card);

    });


  }
});

