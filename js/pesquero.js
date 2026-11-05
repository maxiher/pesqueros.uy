// FECHAS PROVISIONALES: actualizar cada año antes de la próxima temporada.
// Formato AAAA-MM-DD, extremos incluidos. Vigencia: hasta el día anterior
// al inicio de la siguiente temporada anual. No se repiten fechas automáticamente.
const TEMPORADAS_BANISTAS = {
    Montevideo: { inicio: "2026-12-21", fin: "2027-03-21" },
    Canelones: { inicio: "2026-12-21", fin: "2027-03-21" },
    Maldonado: { inicio: "2026-12-21", fin: "2027-03-21" },
    Rocha: { inicio: "2026-12-21", fin: "2027-03-21" }
};

function fechaCalendario(valor) {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const fecha = new Date(`${valor}T00:00:00Z`);
    return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor ? fecha : null;
}

function obtenerTemporada(departamento, ahora = new Date(), configuracion = TEMPORADAS_BANISTAS) {
    const fechas = configuracion[departamento];
    const inicio = fechaCalendario(fechas?.inicio);
    const fin = fechaCalendario(fechas?.fin);
    if (!inicio || !fin || fin < inicio || fin - inicio > 366 * 86400000 ||
        !(ahora instanceof Date) || !Number.isFinite(ahora.getTime())) return { estado: "pendiente" };

    // Comparar días civiles de Uruguay, independientemente de la zona del navegador.
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Montevideo", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(ahora);
    const parte = tipo => partes.find(p => p.type === tipo).value;
    const hoy = fechaCalendario(`${parte("year")}-${parte("month")}-${parte("day")}`);
    const vigenciaDesde = new Date(fin);
    vigenciaDesde.setUTCFullYear(fin.getUTCFullYear() - 1);
    const proximaTemporada = new Date(inicio);
    proximaTemporada.setUTCFullYear(inicio.getUTCFullYear() + 1);
    if (hoy <= vigenciaDesde || hoy >= proximaTemporada) return { estado: "pendiente" };
    return { estado: hoy >= inicio && hoy <= fin ? "dentro" : "fuera", ...fechas };
}

function obtenerEstadoPesca(restriccion, temporada) {
    if (restriccion === 1) return { clase: "habilitada", icono: "\u2713", texto: "Pesca habilitada 24 h" };
    if (restriccion === 3) return { clase: "prohibida", icono: "\u2298", texto: "Pesca prohibida todo el año" };
    if (restriccion === 2) {
        if (temporada.estado === "dentro") return { clase: "restringida", icono: "\u25f7", texto: "Horario restringido por temporada" };
        if (temporada.estado === "fuera") return { clase: "habilitada", icono: "\u2713", texto: "Sin restricción estacional" };
        return { clase: "pendiente", icono: "?", texto: "Restricción estacional pendiente de verificación" };
    }
    return { clase: "pendiente", icono: "?", texto: "Información no disponible" };
}

function escaparTexto(texto) {
    return String(texto).replace(/[&<>"']/g, caracter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caracter]));
}

function mostrarEstadoPesca(estado) {
    return `<span class="estado-pesca estado-${estado.clase}"><span aria-hidden="true">${estado.icono}</span> ${estado.texto}</span>`;
}

const params = new URLSearchParams(window.location.search);
const slug = params.get("id");

cargarVistaDatos({
  contenido: "#pesquero-contenido",
  cargando: "Cargando pesquero...",
  error: "No se pudieron cargar los datos del pesquero.",
  cargar: async () => {
    if (!slug) return { mensaje: "Pesquero no encontrado.", enlace: "pesqueros.html" };
    const [pesqueros, datosEspecies] = await Promise.all([
      cargarJSON("./data/pesqueros.json"),
      cargarJSON("./data/especies.json")
    ]);
    if (!Array.isArray(pesqueros) || !Array.isArray(datosEspecies.especies)) {
      throw new Error("Formato de datos inválido");
    }
    const pesquero = pesqueros.find(p => p.slug === slug);
    if (!pesquero) return { mensaje: "Pesquero no encontrado.", enlace: "pesqueros.html" };
    const especiesPorId = new Map(datosEspecies.especies.map(especie => [especie.id, especie]));
    renderPesquero(pesquero, especiesPorId);
  }
});

function renderPesquero(pesquero, especiesPorId) {
    document.title = `${pesquero.nombre} | PesquerosUY`;

    const contenedor = document.getElementById("pesquero-contenido");

    const especiesOrdenadas = [...pesquero.especies]
        .sort((a, b) => b.nivel - a.nivel)
        .map(especie => {

            const datosEspecie = especiesPorId.get(especie.id);

            if (!datosEspecie) {
                console.warn(`Especie no encontrada: ${especie.id}`);
            }

            return {
                ...especie,
                nombre: datosEspecie?.nombre_comun ?? especie.id,
                tieneFicha: Boolean(datosEspecie)
            };

        });

    contenedor.innerHTML = `
    <a href="pesqueros.html" class="volver-lista">
    ← Volver a lista
</a>
    <section class="carrusel">
    <button class="carrusel-btn anterior" id="btn-anterior" aria-label="Imagen anterior">‹</button>

    <div class="carrusel-imagenes" id="carrusel-imagenes">
        ${pesquero.imagenes.map((imagen, index) => `
            <img
                src="${imagen}"
                alt="${pesquero.nombre}"
                class="carrusel-img ${index === 0 ? "activa" : ""}"
            >
        `).join("")}
    </div>

    <button class="carrusel-btn siguiente" id="btn-siguiente" aria-label="Imagen siguiente">›</button>
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
        Las estrellas indican la frecuencia habitual de captura en temporada.
    </p>

    <div class="lista-especies">
        ${especiesOrdenadas.map(especie => `
            <div class="especie-frecuente">

                ${especie.tieneFicha ? `
  <a
    href="especie.html?id=${especie.id}"
    class="link-especie"
  >
    ${especie.nombre}
  </a>
` : `
  <span class="link-especie">${especie.nombre}</span>
`}

        

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
    <div id="referencias-pesca" class="referencias-pesca"></div>
</section>

    `;
    iniciarCarrusel();
    document.getElementById("pesquero-contenido").hidden = false;
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
    const temporada = obtenerTemporada(pesquero.departamento);
    const ubicaciones = (pesquero.ubicaciones || []).map((ubicacion, index) => ({
        ...ubicacion,
        nombre: typeof ubicacion.nombre === "string" && ubicacion.nombre.trim() ? ubicacion.nombre.trim() : `Punto ${index + 1}`,
        estadoPesca: obtenerEstadoPesca(ubicacion.restriccion, temporada)
    }));
    const textoTemporada = temporada.estado === "pendiente"
        ? "Temporada de bañistas: pendiente de verificación."
        : `${temporada.estado === "dentro" ? "Dentro" : "Fuera"} de temporada de bañistas (${temporada.inicio.split("-").reverse().join("/")} al ${temporada.fin.split("-").reverse().join("/")}).`;
    document.getElementById("referencias-pesca").innerHTML = `
        <strong>Referencias</strong>
        <ul class="leyenda-pesca">
            <li class="estado-habilitada">&#10003; <span>Verde: pesca habilitada o sin restricción estacional.</span></li>
            <li class="estado-restringida">&#9719; <span>Naranja: pesca restringida por temporada.</span></li>
            <li class="estado-prohibida">&#8856; <span>Rojo: pesca prohibida.</span></li>
            <li class="estado-pendiente">? <span>Gris: información no disponible o pendiente de verificación.</span></li>
        </ul>
        <p>${escaparTexto(pesquero.departamento)} &middot; ${textoTemporada}</p>
        <p class="aclaracion-pesca">Información sujeta a la normativa vigente. Las fechas configuradas son provisionales. Los colores indican restricciones de pesca, no banderas de seguridad para bañistas.</p>`;


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

        const marcador = L.marker(coordenada, {
            icon: L.divIcon({
                className: `marcador-pesca estado-${ubicacion.estadoPesca.clase}`,
                html: `<span aria-hidden="true">${ubicacion.estadoPesca.icono}</span>`,
                iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14]
            }),
            title: `${ubicacion.nombre}: ${ubicacion.estadoPesca.texto}`
        })
            .addTo(mapa)
            .bindPopup(contenidoPopup);
        marcadores.push(marcador);
    });

    mapa.fitBounds(coordenadas, {
        padding: [30, 30]
    });



    const listaUbicaciones = document.getElementById("lista-ubicaciones");

    listaUbicaciones.innerHTML = ubicaciones.map((ubicacion, index) => `
    <div class="ubicacion-item estado-${ubicacion.estadoPesca.clase}">
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
            <strong>${escaparTexto(ubicacion.nombre)}</strong>
            <p>${mostrarEstadoPesca(ubicacion.estadoPesca)}</p>

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

