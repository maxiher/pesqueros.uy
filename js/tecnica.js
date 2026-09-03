const params = new URLSearchParams(window.location.search);
const idTecnica = params.get("id");

fetch("./data/tecnicas.json")
    .then(response => response.json())
    .then(data => {

        const tecnica = data.find(
            tecnica => tecnica.id === idTecnica
        );

        if (!tecnica) {
            throw new Error("Técnica no encontrada");
        }

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

    })
    .catch(error => {
        console.error("Error al cargar la técnica:", error);
    });