document.addEventListener("DOMContentLoaded", () => {
    const navbarContainer = document.getElementById("navbar-container");

    if (navbarContainer) {
        navbarContainer.innerHTML = `
            <header class="main-header">
                <div class="logo-container">
                    <a href="index.html">
                     <img src="Fotos/General/LogoEnNegro.png" width="15%"  class="logo"></img>
                    </a>
                </div>
                
                <button class="menu-toggle" aria-label="Abrir menú">
                    <div class="burger-icon">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </div>
                </button>

                <nav class="nav-menu">
                    <ul>
                        <li><a href="pesqueros.html">Pesqueros</a></li>
                        <li><a href="especies.html">Especies</a></li>
                        <li><a href="tecnicas.html">Técnicas y Equipos</a></li>
                        <li><a href="shop.html">Shop</a></li>
                        <li><a href="contacto.html">Contáctanos</a></li>
                    </ul>
                </nav>
            </header>
        `;

        // Lógica de apertura/cierre
        const menuToggle = navbarContainer.querySelector('.menu-toggle');
        const navMenu = navbarContainer.querySelector('.nav-menu');

        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
});