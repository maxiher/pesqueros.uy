// Estado por entrada del historial: una visita nueva no hereda filtros anteriores.
function crearEstadoListado(nombre, obtenerEstado) {
  const tipoNavegacion = performance.getEntriesByType("navigation")[0]?.type;
  const esRegreso = tipoNavegacion === "back_forward" || tipoNavegacion === "reload";
  let entrada = esRegreso ? history.state?.pesquerosEntrada : null;
  if (!entrada) {
    entrada = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    history.replaceState({ ...history.state, pesquerosEntrada: entrada }, "");
  }
  const clave = `pesquerosuy:listado:${nombre}:${entrada}`;
  let guardado = null;
  let listo = false;
  try {
    const valor = JSON.parse(sessionStorage.getItem(clave));
    if (valor && typeof valor === "object" && !Array.isArray(valor)) guardado = valor;
  } catch {
    // La navegación sigue funcionando si el almacenamiento no está disponible.
  }

  window.addEventListener("pagehide", () => {
    if (!listo) return;
    try {
      sessionStorage.setItem(clave, JSON.stringify({ ...obtenerEstado(), scroll: window.scrollY }));
    } catch {
      // sessionStorage puede estar bloqueado o sin espacio.
    }
  });

  return {
    guardado,
    listo() {
      if (listo) return;
      listo = true;
      if (!Number.isFinite(guardado?.scroll) || guardado.scroll < 0) return;
      // Esperar a que cargarVistaDatos vuelva a mostrar los resultados.
      let cancelado = false;
      const cancelar = () => { cancelado = true; };
      const eventos = ["wheel", "touchstart", "pointerdown", "keydown"];
      eventos.forEach(tipo => window.addEventListener(tipo, cancelar, { passive: true }));
      const restaurar = () => {
        if (!cancelado) window.scrollTo({ top: guardado.scroll, behavior: "instant" });
      };
      requestAnimationFrame(restaurar);
      const terminar = () => {
        requestAnimationFrame(restaurar);
        eventos.forEach(tipo => window.removeEventListener(tipo, cancelar));
      };
      if (document.readyState === "complete") terminar();
      else window.addEventListener("load", terminar, { once: true });
    }
  };
}

// Delegación para cubrir también el enlace generado dinámicamente en pesquero.js.
document.addEventListener("click", evento => {
  const enlace = evento.target.closest("a[data-volver]");
  if (!enlace || evento.defaultPrevented || evento.button !== 0 ||
      evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;

  let anterior;
  try {
    // Navigation API permite comprobar la entrada inmediatamente anterior.
    const navegacion = window.navigation;
    if (navegacion?.currentEntry) {
      anterior = navegacion.entries().find(entrada => entrada.index === navegacion.currentEntry.index - 1)?.url;
    } else if (history.length > 1) {
      anterior = document.referrer;
    }
    if (!anterior) return;
    const url = new URL(anterior);
    const sitio = new URL(".", window.location.href);
    if (url.origin !== sitio.origin || !url.pathname.startsWith(sitio.pathname)) return;
    evento.preventDefault();
    history.back();
  } catch {
    // Conservar el href de respaldo si no se puede verificar el destino.
  }
});
