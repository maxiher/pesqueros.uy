// Utilidades compartidas por las páginas que leen datos locales.
async function cargarJSON(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta}: HTTP ${respuesta.status}`);
  }
  return respuesta.json();
}

function mostrarEstadoDatos(mensaje, reintentar, enlace) {
  const estado = document.getElementById("estado-datos");
  estado.replaceChildren();
  estado.hidden = !mensaje;
  if (!mensaje) return;

  const texto = document.createElement("p");
  texto.textContent = mensaje;
  estado.appendChild(texto);

  if (reintentar) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Reintentar";
    boton.addEventListener("click", reintentar);
    estado.appendChild(boton);
  }
  if (enlace) {
    const volver = document.createElement("a");
    volver.href = enlace;
    volver.textContent = "Volver al listado";
    estado.appendChild(volver);
  }
}

// La función de página devuelve un mensaje cuando no hay contenido para mostrar.
function cargarVistaDatos({ cargar, contenido, cargando, error }) {
  const contenedor = document.querySelector(contenido);
  async function ejecutar() {
    contenedor.hidden = true;
    contenedor.setAttribute("aria-busy", "true");
    mostrarEstadoDatos(cargando);
    try {
      const resultado = await cargar();
      mostrarEstadoDatos(resultado?.mensaje ?? "", null, resultado?.enlace);
      contenedor.hidden = Boolean(resultado?.mensaje);
    } catch (causa) {
      contenedor.hidden = true;
      console.error(error, causa);
      mostrarEstadoDatos(error, ejecutar);
    } finally {
      contenedor.setAttribute("aria-busy", "false");
    }
  }
  ejecutar();
}
