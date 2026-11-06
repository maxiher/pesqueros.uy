
document.addEventListener("DOMContentLoaded", () => {
    const footerContainer = document.getElementById("footer-container");

    if (!footerContainer) return;

    const anio = new Date().getFullYear();

    footerContainer.innerHTML = `
        <footer class="site-footer">
            <div class="footer-inner">

                <div class="footer-main">
                    <div class="footer-about">
                        <div class="footer-brand">
                            <svg viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2"
                                 stroke-linecap="round" stroke-linejoin="round"
                                 aria-hidden="true">
                                <path d="M2 7c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>
                                <path d="M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>
                                <path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>
                            </svg>
                            <h2>PesquerosUY</h2>
                        </div>

                        <p>Información creada por pescadores, para pescadores.</p>
                        <p>Conocé, disfrutá y cuidá nuestras costas.</p>
                    </div>

                    <nav class="footer-nav" aria-label="Navegación del pie de página">
                        <h2>Explorar</h2>
                        <ul>
                            <li><a href="index.html">Inicio</a></li>
                            <li><a href="pesqueros.html">Pesqueros</a></li>
                            <li><a href="especies.html">Especies</a></li>
                            <li><a href="tecnicas.html">Técnicas y equipos</a></li>
                            <li><a href="contacto.html">Contacto</a></li>
                        </ul>
                    </nav>
                </div>

                <div class="footer-bottom">
                    <p>© ${anio} PesquerosUY. Todos los derechos reservados.</p>
                    <p>Hecho en Uruguay 🇺🇾</p>
                </div>

            </div>
        </footer>
    `;
});
