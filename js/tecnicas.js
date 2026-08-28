const contenedor = document.getElementById("contenedor-tecnicas");

fetch("./data/tecnicas.json")
    .then(response => response.json())
    .then(data => {
        console.log(data)
        data.forEach(tecnica => {

            const card = document.createElement("a");

            card.classList.add("card-tecnica");

            card.href = `tecnica.html?id=${tecnica.id}`;

            card.innerHTML = `
                <img
                    src="${tecnica.imagen}"
                    alt="${tecnica.nombre}"
                    class="card-tecnica-img"
                >

                <div class="card-tecnica-body">

                    <h2>${tecnica.nombre}</h2>

                    <p>
                        ${tecnica.descripcion}
                    </p>

                    <span class="card-tecnica-link">
                        Ver técnica →
                    </span>

                </div>
            `;

            contenedor.appendChild(card);
        });

    })
    .catch(error => {
        console.error("Error al cargar las técnicas:", error);
    });