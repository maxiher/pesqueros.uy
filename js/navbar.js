document.addEventListener("DOMContentLoaded", () => {
    const navbarContainer = document.getElementById("navbar-container");

    if (navbarContainer) {
        // El header externo debe ser sticky; su hijo no puede salir de él.
        const navbarShell = navbarContainer.closest('header') || navbarContainer;
        navbarShell.classList.add('navbar-shell');

        navbarContainer.innerHTML = `
            <div class="main-header">
                <div class="logo-container">
                    <a href="index.html">
                     <img src="Fotos/General/logoBlanco.webp" class="logo" alt="PesquerosUY — Inicio">
                    </a>
                </div>
                
                <button type="button" class="menu-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navbar-menu">
                    <span class="burger-icon" aria-hidden="true">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </span>
                </button>

                <nav id="navbar-menu" class="nav-menu" aria-label="Navegación principal">
                    <ul>
                        <li><a href="pesqueros.html">Pesqueros</a></li>
                        <li><a href="especies.html">Especies</a></li>
                        <li><a href="tecnicas.html">Técnicas y Equipos</a></li>
                        <!-- <li><a href="shop.html">Shop</a></li> --> 
                        <li><a href="contacto.html">Contáctanos</a></li>
                    </ul>
                </nav>
            </div>
        `;

        // Los detalles pertenecen a la misma sección que su listado.
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const sectionPages = {
            'pesqueros.html': 'pesqueros.html',
            'pesquero.html': 'pesqueros.html',
            'especies.html': 'especies.html',
            'especie.html': 'especies.html',
            'tecnicas.html': 'tecnicas.html',
            'tecnica.html': 'tecnicas.html',
            'contacto.html': 'contacto.html'
        };
        const sectionPage = sectionPages[currentPage];
        const currentLink = navbarContainer.querySelector(`.nav-menu a[href="${sectionPage}"]`);
        if (currentLink) {
            currentLink.setAttribute('aria-current', currentPage === sectionPage ? 'page' : 'location');
        }

        // Lógica de apertura/cierre
        const menuToggle = navbarContainer.querySelector('.menu-toggle');
        const navMenu = navbarContainer.querySelector('.nav-menu');

        const setMenuOpen = (open) => {
            menuToggle.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        };

        menuToggle.addEventListener('click', () => {
            setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
        });

        navbarContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menuToggle.classList.contains('active')) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });

        const mobileMenu = window.matchMedia('(max-width: 900px)');
        mobileMenu.addEventListener('change', () => setMenuOpen(false));

        const header = navbarContainer.querySelector('.main-header');
        const hero = document.body.classList.contains('home-page')
            ? document.querySelector('.hero')
            : null;

        if (!hero) {
            header.classList.add('nav-scrolled');
            return;
        }

        let scrollThreshold = 0;
        let framePending = false;
        let scrolled;

        const updateScrollState = () => {
            const nextScrolled = window.scrollY >= scrollThreshold;
            if (nextScrolled !== scrolled) {
                header.classList.toggle('nav-scrolled', nextScrolled);
                scrolled = nextScrolled;
            }
        };

        const measureThreshold = () => {
            scrollThreshold = hero.getBoundingClientRect().bottom + window.scrollY
                - header.getBoundingClientRect().height;
            updateScrollState();
        };

        // En scroll solo se compara la posición; no se vuelve a medir el layout.
        window.addEventListener('scroll', () => {
            if (framePending) return;
            framePending = true;
            window.requestAnimationFrame(() => {
                framePending = false;
                updateScrollState();
            });
        }, { passive: true });

        window.addEventListener('resize', measureThreshold);
        window.addEventListener('load', measureThreshold, { once: true });
        window.addEventListener('pageshow', measureThreshold);

        const resizeObserver = new ResizeObserver(measureThreshold);
        resizeObserver.observe(hero);
        resizeObserver.observe(header);
        measureThreshold();
    }
});
