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


function crearIconoMarcadorPesca(estado) {
    const svgPez = `
        <svg class="marcador-pesca-svg"
             aria-hidden="true"
             viewBox="0 0 48 62"
             fill="none">

            <!-- Silueta del marcador -->
            <path
                d="M24 1.5C11.55 1.5 2 11.05 2 23.5c0 16.2 22 36.5 22 36.5s22-20.3 22-36.5C46 11.05 36.45 1.5 24 1.5Z"
                fill="currentColor"
                stroke="white"
                stroke-width="2.5"
            />

            <!-- Fondo blanco -->
            <circle cx="24" cy="23.5" r="17.5" fill="white"/>

            <!-- Pez -->
            <path
                d="M11.5 23.5c3.25-4.25 7.25-6.7 12.5-6.7 5 0 8.45 2.7 10.8 6.7-2.35 4-5.8 6.7-10.8 6.7-5.25 0-9.25-2.45-12.5-6.7Zm22.6 0L40 17.75v11.5l-5.9-5.75Z"
                fill="currentColor"
                transform="translate(-3, 0) "
            />

            <!-- Ojo -->
            <circle cx="17.8" cy="22" r="1.45" fill="white"/>
        </svg>`;

    return L.divIcon({
        className: `marcador-pesca estado-${estado.clase}`,
        html: svgPez,
        iconSize: [36, 47],
        iconAnchor: [18, 47],
        popupAnchor: [0, -45]
    });
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
    <a href="pesqueros.html" class="volver-lista" data-volver>
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
        ? "Temporada de ba\u00f1istas pendiente de verificar."
        : `${temporada.estado === "dentro" ? "Dentro" : "Fuera"} de temporada de ba\u00f1istas.`;
    const referencias = new Map(ubicaciones.map(({ estadoPesca }) => [estadoPesca.clase, estadoPesca]));
    const etiquetas = {
        habilitada: "Habilitada", restringida: "Restringida por temporada",
        prohibida: "Prohibida", pendiente: "Sin verificar"
    };
    const omitirLeyenda = temporada.estado === "fuera" && referencias.size === 1 && referencias.has("habilitada");
    document.getElementById("referencias-pesca").innerHTML = `
        ${omitirLeyenda || !referencias.size ? "" : `
        <ul class="leyenda-pesca" aria-label="Referencias de pesca">
            ${[...referencias.values()].map(estado => `
                <li class="estado-${estado.clase}"><span aria-hidden="true">${estado.icono}</span> ${etiquetas[estado.clase]}</li>
            `).join("")}
        </ul>`}
        <p>${escaparTexto(pesquero.departamento)} &middot; ${textoTemporada}</p>
        <p class="aclaracion-pesca">Fechas provisionales. Informaci\u00f3n sujeta a la normativa vigente.</p>`;


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
            icon: crearIconoMarcadorPesca(ubicacion.estadoPesca),
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

    listaUbicaciones.innerHTML = ubicaciones.map((ubicacion, index) => {
        const estado = ubicacion.estadoPesca;
        const advertencia = estado.clase === "prohibida" ? "Pesca prohibida"
            : estado.clase === "pendiente" ? "Informaci\u00f3n no verificada" : estado.texto;
        const mostrarTexto = temporada.estado === "dentro" || estado.clase === "prohibida" || estado.clase === "pendiente";
        const mostrarIconoEstado = estado.clase !== "habilitada";
        return `
        <article class="ubicacion-item estado-${estado.clase}" data-index="${index}">
            <svg class="ubicacion-pin" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
            </svg>
            <span class="ubicacion-contenido">
                <strong>${escaparTexto(ubicacion.nombre)}</strong>
                ${mostrarTexto ? `<span class="ubicacion-advertencia">${advertencia}</span>` : ""}
            </span>
            ${mostrarIconoEstado ? `<span class="ubicacion-estado" aria-hidden="true">${estado.icono}</span>` : ""}
            <button type="button" class="ver-en-mapa" data-index="${index}"
                aria-label="Ver ${escaparTexto(ubicacion.nombre)} en el mapa">Ver en mapa</button>
        </article>`;
    }).join("");

    function seleccionarUbicacion(index) {
        listaUbicaciones.querySelectorAll(".ubicacion-item").forEach((card, cardIndex) => {
            card.classList.toggle("ubicacion-seleccionada", cardIndex === index);
        });
    }

    listaUbicaciones.querySelectorAll(".ver-en-mapa").forEach(boton => {
        boton.addEventListener("click", () => {
            const index = Number(boton.dataset.index);
            const ubicacion = ubicaciones[index];

            seleccionarUbicacion(index);
            mapa.setView(
                [ubicacion.lat, ubicacion.lng],
                16
            );

            marcadores[index].openPopup();
        });
    });

    marcadores.forEach((marcador, index) => {
        marcador.on("click", () => seleccionarUbicacion(index));
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

