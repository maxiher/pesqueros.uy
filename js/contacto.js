
const formulario = document.querySelector("#form-contacto");
const boton = formulario.querySelector('button[type="submit"]');
const estado = document.querySelector("#estado-contacto");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  boton.disabled = true;
  boton.textContent = "Enviando...";
  estado.textContent = "";
  estado.className = "mt-3";

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

    estado.textContent = "¡Gracias! Tu mensaje fue enviado correctamente.";
    estado.classList.add("text-success");
    formulario.reset();

  } catch (error) {
    estado.textContent =
      "No pudimos enviar tu mensaje. Intentá nuevamente.";
    estado.classList.add("text-danger");

  } finally {
    boton.disabled = false;
    boton.textContent = "Enviar mensaje";
  }
});
