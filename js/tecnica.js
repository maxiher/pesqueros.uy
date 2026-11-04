const params = new URLSearchParams(window.location.search);
const idTecnica = params.get("id");

cargarVistaDatos({
  contenido: ".detalle-tecnica",
  cargando: "Cargando técnica...",
  error: "No se pudo cargar la técnica.",
  cargar: async () => {
    if (!idTecnica) return { mensaje: "Técnica no encontrada.", enlace: "tecnicas.html" };
    const data = await cargarJSON("./data/tecnicas.json");
    if (!Array.isArray(data)) throw new Error("Formato de datos inválido");


        const tecnica = data.find(
            tecnica => tecnica.id === idTecnica
        );

        if (!tecnica) {
            return { mensaje: "Técnica no encontrada.", enlace: "tecnicas.html" };
        }
        document.getElementById("equipo-recomendado").replaceChildren();
        document.getElementById("galeria-tecnica").replaceChildren();
        document.getElementById("seccion-galeria").hidden = true;


        // TÍTULO
        document.title = `${tecnica.nombre} | PesquerosUY`;


        // INFORMACIÓN PRINCIPAL
        const imagen = document.getElementById("imagen-tecnica");

        imagen.src = tecnica.portada;
        imagen.alt = tecnica.nombre;

        document.getElementById("nombre-tecnica").textContent =
            tecnica.nombre;

        document.getElementById("descripcion-tecnica").textContent =
            tecnica.descripcion;


        // EQUIPO RECOMENDADO
        const contenedorEquipo =
            document.getElementById("equipo-recomendado");

        Object.values(tecnica.equipo_recomendado).forEach(equipo => {

            const card = document.createElement("article");

            card.classList.add("equipo-card");

            card.innerHTML = `
                <h3>${equipo.nombre}</h3>
                <p>${equipo.detalle}</p>
            `;

            contenedorEquipo.appendChild(card);
        });


        // GALERÍA
        if (tecnica.imagenes.length > 0) {

            const seccionGaleria =
                document.getElementById("seccion-galeria");

            const galeria =
                document.getElementById("galeria-tecnica");

            seccionGaleria.hidden = false;

            tecnica.imagenes.forEach(rutaImagen => {

                const img = document.createElement("img");

                img.src = rutaImagen;
                img.alt = tecnica.nombre;

                galeria.appendChild(img);
            });
        }


  }
});