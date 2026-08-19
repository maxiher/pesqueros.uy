const params = new URLSearchParams(window.location.search);
const slug = params.get("id");

fetch("./data/pesqueros.json")
    .then(response => response.json())
    .then(pesqueros => {
        const pesquero = pesqueros.find(p => p.slug === slug);

        if (!pesquero) {
            document.getElementById("pesquero-contenido").innerHTML =
                "<p>Pesquero no encontrado.</p>";
            return;
        }

        renderPesquero(pesquero);
    })
    .catch(error => {
        console.error("Error al cargar el pesquero:", error);
    });

function renderPesquero(pesquero) {
    document.title = `${pesquero.nombre} | PesquerosUY`;

    const contenedor = document.getElementById("pesquero-contenido");

    contenedor.innerHTML = `
        <h1>${pesquero.nombre}</h1>
        <p>${pesquero.descripcion}</p>
    `;
}

function renderPesquero(pesquero) {
    document.title = `${pesquero.nombre} | PesquerosUY`;

    const contenedor = document.getElementById("pesquero-contenido");

    const especiesOrdenadas = [...pesquero.especies]
    .sort((a, b) => b.nivel - a.nivel);

    contenedor.innerHTML = `
    <a href="pesqueros.html" class="volver-lista">
    ← Volver a lista
</a>
    <section class="carrusel">
    <button class="carrusel-btn anterior" id="btn-anterior">‹</button>

    <div class="carrusel-imagenes" id="carrusel-imagenes">
        ${pesquero.imagenes.map((imagen, index) => `
            <img 
                src="${imagen}" 
                alt="${pesquero.nombre}"
                class="carrusel-img ${index === 0 ? "activa" : ""}"
            >
        `).join("")}
    </div>

    <button class="carrusel-btn siguiente" id="btn-siguiente">›</button>
    <div class="carrusel-indicadores">
    ${pesquero.imagenes.map((_, index) => `
        <span class="indicador ${index === 0 ? "activo" : ""}"></span>
    `).join("")}
</div>
</section>

        <h1>${pesquero.nombre}</h1>

        <section class="card-caracteristicas">
            <h2>Características</h2>

            

            <div class="caracteristica">
                <span>Accesibilidad</span>
                <strong>${pesquero.acceso}</strong>
            </div>

            <div class="caracteristica">
                <span>Profundidad</span>
                <div class="escala">
                    ${crearEscala(pesquero.profundidad)}
                </div>
            </div>

            <div class="caracteristica">
                <span>Riesgo de enganche</span>
                <div class="escala">
                    ${crearEscala(pesquero.enganche)}
                </div>
            </div>

            <div class="caracteristica">
                <span>Mejor viento</span>
                <strong>${pesquero.mejorViento}</strong>
            </div>
            
        </section>
        <section class="card-especies">
    <h2>Especies frecuentes</h2>

    <p class="aclaracion-especies">
        Las estrellas indican la frecuencia habitual de captura.
    </p>

    <div class="lista-especies">
        ${especiesOrdenadas.map(especie => `
            <div class="especie-frecuente">
                <span>${especie.nombre}</span>

                <div class="estrellas">
                    ${crearEstrellas(especie.nivel)}
                </div>
            </div>
        `).join("")}
    </div>
    
</section>
<section class="card-ubicaciones">
    <h2>Ubicaciones</h2>

    <div id="map"></div>

    <div id="lista-ubicaciones"></div>
</section>
        
    `;
    iniciarCarrusel();
    iniciarMapa(pesquero);
}

function crearEscala(nivel) {
    let html = "";

    for (let i = 1; i <= 5; i++) {
        html += `
            <span class="barra ${i <= nivel ? "activa" : ""}"></span>
        `;
    }

    return html;
}

function crearEstrellas(nivel) {
    let estrellas = "";

    for (let i = 1; i <= 5; i++) {
        estrellas += i <= nivel ? "★" : "☆";
    }

    return estrellas;
}

function iniciarCarrusel() {
    const imagenes = document.querySelectorAll(".carrusel-img");
    const btnAnterior = document.getElementById("btn-anterior");
    const btnSiguiente = document.getElementById("btn-siguiente");
    const indicadores = document.querySelectorAll(".indicador");

    let indiceActual = 0;

    function mostrarImagen(indice) {
        imagenes.forEach(img => img.classList.remove("activa"));
    indicadores.forEach(indicador => indicador.classList.remove("activo"));

    imagenes[indice].classList.add("activa");
    indicadores[indice].classList.add("activo");
    }

    btnSiguiente.addEventListener("click", () => {
        indiceActual++;

        if (indiceActual >= imagenes.length) {
            indiceActual = 0;
        }

        mostrarImagen(indiceActual);
    });

    btnAnterior.addEventListener("click", () => {
        indiceActual--;

        if (indiceActual < 0) {
            indiceActual = imagenes.length - 1;
        }

        mostrarImagen(indiceActual);
    });

    indicadores.forEach((indicador, index) => {
    indicador.addEventListener("click", () => {
        indiceActual = index;
        mostrarImagen(indiceActual);
    });
});
}

function iniciarMapa(pesquero) {
    const ubicaciones = pesquero.ubicaciones;
    

    if (!ubicaciones || ubicaciones.length === 0) {
        return;
    }

    const mapa = L.map("map");
    const marcadores = [];

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapa);

    const coordenadas = [];

    ubicaciones.forEach(ubicacion => {
        const coordenada = [ubicacion.lat, ubicacion.lng];

        coordenadas.push(coordenada);

        const contenidoPopup = crearPopupUbicacion(ubicacion);

const marcador = L.marker(coordenada)
    .addTo(mapa)
    .bindPopup(contenidoPopup);
    marcadores.push(marcador);
});

    mapa.fitBounds(coordenadas, {
        padding: [30, 30]
    });

    

    const listaUbicaciones = document.getElementById("lista-ubicaciones");

listaUbicaciones.innerHTML = ubicaciones.map((ubicacion, index) => `
    <div class="ubicacion-item">
        <div>
            <strong>📍 ${ubicacion.nombre}</strong>
        </div>

        <button class="ver-en-mapa" data-index="${index}">
            Ver en el mapa
        </button>
    </div>
`).join("");

document.querySelectorAll(".ver-en-mapa").forEach(boton => {
        boton.addEventListener("click", () => {
            const index = Number(boton.dataset.index);
            const ubicacion = ubicaciones[index];

            mapa.setView(
                [ubicacion.lat, ubicacion.lng],
                16
            );

            marcadores[index].openPopup();
        });
    });
}

function crearPopupUbicacion(ubicacion) {
    let detalles = "";

    if (ubicacion.profundidad) {
        detalles += `<p>Profundidad: ${ubicacion.profundidad}</p>`;
    }

    if (ubicacion.enganche) {
        detalles += `<p>Enganche: ${ubicacion.enganche}</p>`;
    }

    if (ubicacion.acceso) {
        detalles += `<p>Acceso: ${ubicacion.acceso}</p>`;
    }

    const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${ubicacion.lat},${ubicacion.lng}`;
    const waze = `https://www.waze.com/ul?ll=${ubicacion.lat},${ubicacion.lng}&navigate=yes`;

    return `
        <div class="popup-ubicacion">
            <strong>${ubicacion.nombre}</strong>

            ${detalles}

            <div class="popup-enlaces">
                <a href="${googleMaps}" target="_blank" rel="noopener noreferrer">
                    Google Maps
                </a>

                <a href="${waze}" target="_blank" rel="noopener noreferrer">
                    Waze
                </a>
            </div>
        </div>
    `;
}

