const contenedor = document.getElementById("contenedor-especies");

fetch("./data/especies.json")
  .then(response => response.json())
  .then(data => {

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

  })
  .catch(error => {
    console.error("Error al cargar las especies:", error);
  });

  