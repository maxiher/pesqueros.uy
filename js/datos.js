// Utilidades compartidas por las páginas que leen datos locales.
async function cargarJSON(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta}: HTTP ${respuesta.status}`);
  }
  return respuesta.json();
}

function mostrarEstadoDatos(mensaje, reintentar, enlace, tipo = reintentar ? "error" : "vacio", destino = "estado-datos") {
  const estado = document.getElementById(destino);
  estado.replaceChildren();
  estado.hidden = !mensaje;
  estado.className = `estado-datos estado-datos--${tipo}`;
  if (!mensaje) return;

  const icono = document.createElement("span");
  icono.className = tipo === "carga" ? "estado-datos__pez" : "estado-datos__icono";
  icono.setAttribute("aria-hidden", "true");
  if (tipo === "carga") {
    // SVG decorativo fijo; los mensajes siguen insertándose con textContent.
    icono.innerHTML = `
      <svg class="estado-datos__pez-svg" viewBox="0 0 140 90"
           xmlns="http://www.w3.org/2000/svg" focusable="false">
        <path class="estado-datos__pez-cola" d="M30 45 L8 25 Q2 45 8 65 Z" />
        <path class="estado-datos__pez-cuerpo"
              d="M28 45 Q48 15 92 18 Q122 20 132 45 Q122 70 92 72 Q48 75 28 45 Z" />
        <path class="estado-datos__pez-aleta" d="M58 24 L48 10 L74 22 Z" />
        <path class="estado-datos__pez-aleta" d="M62 66 L52 79 L78 68 Z" />
        <circle class="estado-datos__pez-ojo" cx="103" cy="38" r="4.2" />
        <path class="estado-datos__pez-boca" d="M112 51 Q118 54 124 50" />
      </svg>
    `;
  } else {
    icono.textContent = tipo === "error" ? "⚠️" : "🔎";
  }
  estado.appendChild(icono);

  if (tipo === "carga") {
    const spinner = document.createElement("span");
    spinner.className = "estado-datos__spinner";
    spinner.setAttribute("aria-hidden", "true");
    estado.appendChild(spinner);
  } else {
    const titulo = document.createElement("h2");
    titulo.className = "estado-datos__titulo";
    titulo.textContent = tipo === "error"
      ? (estado.dataset.tituloError ?? "No se pudieron cargar los datos")
      : mensaje;
    estado.appendChild(titulo);
  }

  const texto = document.createElement("p");
  texto.className = "estado-datos__texto";
  texto.textContent = mensaje;
  if (tipo === "carga" || tipo === "error") estado.appendChild(texto);

  if (reintentar) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "estado-datos__accion";
    boton.textContent = "Reintentar";
    boton.addEventListener("click", reintentar);
    estado.appendChild(boton);
  }
  if (enlace) {
    const volver = document.createElement("a");
    volver.href = enlace;
    volver.className = "estado-datos__accion";
    volver.textContent = "Volver al listado";
    estado.appendChild(volver);
  }
}

// La función de página devuelve un mensaje cuando no hay contenido para mostrar.
function cargarVistaDatos({ cargar, contenido, cargando, error, estado = "estado-datos" }) {
  const contenedores = document.querySelectorAll(contenido);
  async function ejecutar() {
    contenedores.forEach(contenedor => {
      contenedor.hidden = true;
      contenedor.setAttribute("aria-busy", "true");
    });
    mostrarEstadoDatos(cargando, null, null, "carga", estado);
    try {
      const resultado = await cargar();
      mostrarEstadoDatos(resultado?.mensaje ?? "", null, resultado?.enlace, "vacio", estado);
      contenedores.forEach(contenedor => { contenedor.hidden = Boolean(resultado?.mensaje); });
    } catch (causa) {
      contenedores.forEach(contenedor => { contenedor.hidden = true; });
      console.error(error, causa);
      mostrarEstadoDatos(error, ejecutar, null, "error", estado);
    } finally {
      contenedores.forEach(contenedor => { contenedor.setAttribute("aria-busy", "false"); });
    }
  }
  ejecutar();
}
