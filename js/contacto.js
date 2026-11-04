
const formulario = document.querySelector("#form-contacto");
const boton = formulario.querySelector('button[type="submit"]');
const estado = document.querySelector("#estado-contacto");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (boton.disabled) return;

  boton.disabled = true;
  boton.textContent = "Enviando...";
  formulario.setAttribute("aria-busy", "true");
  mostrarEstadoDatos("Enviando tu mensaje...", null, null, "carga", "estado-contacto");

  try {
    const respuesta = await fetch(formulario.action, {
      method: "POST",
      body: new FormData(formulario),
      headers: {
        Accept: "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error("Error al enviar el formulario");
    }

    estado.replaceChildren();
    estado.className = "mt-3 text-success";
    estado.textContent = "¡Gracias! Tu mensaje fue enviado correctamente.";
    formulario.reset();

  } catch (error) {
    mostrarEstadoDatos(
      "No pudimos enviar tu mensaje. Intentá nuevamente.",
      () => formulario.requestSubmit(),
      null,
      "error",
      "estado-contacto"
    );

  } finally {
    boton.disabled = false;
    boton.textContent = "Enviar mensaje";
    formulario.setAttribute("aria-busy", "false");
  }
});
