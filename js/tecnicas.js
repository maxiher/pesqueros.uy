const contenedor = document.getElementById("contenedor-tecnicas");

cargarVistaDatos({
  contenido: "#contenedor-tecnicas",
  cargando: "Cargando técnicas...",
  error: "No se pudieron cargar las técnicas.",
  cargar: async () => {
    const data = await cargarJSON("./data/tecnicas.json");
    if (!Array.isArray(data)) throw new Error("Formato de datos inválido");
    contenedor.replaceChildren();
    if (data.length === 0) return { mensaje: "No hay técnicas disponibles." };
    data.forEach(tecnica => {

            const card = document.createElement("a");

            card.classList.add("card-tecnica");

            card.href = `tecnica.html?id=${tecnica.id}`;

            card.innerHTML = `
                <img
                    src="${tecnica.portada}"
                    alt="${tecnica.nombre}"
                    class="card-tecnica-img"
                >

                <div class="card-tecnica-body">

                    <h2>${tecnica.nombre}</h2>

                    <p>
                        ${tecnica.descripcion}
                    </p>

                    <span class="card-tecnica-link">
                        Ver técnica →
                    </span>

                </div>
            `;

            contenedor.appendChild(card);
        });


  }
});