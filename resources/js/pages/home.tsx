import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

const homeMarkup = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="Inicio">
      <img src="/assets/optimized/fme-04.png" alt="Fray Municipalidad" width="1024" height="684" decoding="async">
    </a>
    <button class="icon-button menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="main-nav" aria-label="Menu principal">
      <a href="#gobierno-abierto">Gobierno Abierto</a>
      <a href="/juzgado-faltas">Juzgado de Faltas</a>
      <a href="#parque-botanico">Parque Botánico</a>
      <a href="/rentas">Rentas</a>
      <a href="/gabinete.html">Gobierno</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="hero-media" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="kicker">Fray Mamerto Esquiú</p>
        <h1>Tu municipio, más cerca.</h1>
        <p>Hacé trámites, consultá servicios y encontrá información municipal de forma simple y rápida.</p>
      </div>
    </section>

    <section class="useful-phones" aria-label="Teléfonos útiles de WhatsApp">
      <div class="section-heading">
        <p class="kicker">WhatsApp</p>
        <h2>Teléfonos útiles</h2>
      </div>
      <div class="phone-list">
        <a href="https://wa.me/543834586744">
          <strong>Dirección de Rentas</strong>
          <span>3834586744</span>
        </a>
        <a href="/juzgado-faltas">
          <strong>Juzgado Administrativo Municipal de Faltas</strong>
          <span>3834195730</span>
        </a>
        <a href="https://wa.me/543834804322">
          <strong>Quiú, chatbot municipal</strong>
          <span>3834804322</span>
        </a>
      </div>
    </section>

    <section class="service-banner" aria-labelledby="sepelio-banner-title" hidden>
      <div>
        <h2 id="sepelio-banner-title">Servicio de Sepelio San José</h2>
        <p>Planes familiares, tarifas individuales, requisitos de inscripción y consulta telefónica.</p>
      </div>
      <a class="button" href="/sepelio-san-jose.html">Consultar requisitos</a>
    </section>

    <section class="botanical-section" id="parque-botanico" aria-labelledby="botanical-title">
      <img src="/assets/optimized/parque-botanico.jpeg" alt="Ingreso al Parque Botánico" width="1280" height="960" loading="lazy" decoding="async">
      <div class="botanical-content">
        <div class="section-heading">
          <p class="kicker">Nuevo</p>
          <h2 id="botanical-title">Parque Botánico</h2>
        </div>
        <div class="botanical-info">
          <article>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10ZM6 8h12V6H6v2Zm3 4h2v2H9v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2H9v-2Z"/></svg>
            <div>
              <span>Horario de invierno</span>
              <strong>Miércoles a domingo</strong>
              <p>De 9 a 13 hs. y de 14 a 18 hs.</p>
            </div>
          </article>
          <article>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3V6Zm2 3v6h14V9H5Zm2 2h4v2H7v-2Zm8-1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>
            <div>
              <span>Entrada general:</span>
              <strong>$2.000</strong>
              <p>Comprá tu entrada online.</p>
            </div>
          </article>
        </div>
        <div class="botanical-actions">
          <a class="outline-button whatsapp-button" href="https://wa.me/5493834732176">WhatsApp</a>
          <a class="outline-button" href="https://maps.app.goo.gl/H6HMCtC99nQJDf427">Ver ubicación</a>
          <a class="button" href="https://municipalidad.com/fray/pagoconceptos">Comprar entrada</a>
        </div>
      </div>
    </section>

    <section class="payment-landing" aria-label="Consulta y pago de tasas">
      <div class="section-heading">
        <p class="kicker">Dirección de Rentas</p>
        <h2>Consulta y pago de deuda</h2>
      </div>
      <p>Consultá tus deudas y realizá pagos municipales de forma online.</p>
      <div class="payment-grid">
        <a href="https://www.municipalidad.com/fray/deuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4v-9Zm2 .9V18h2v-6h8v6h2v-6.1l-6-5.25-6 5.25Z"/></svg><span>Tasa de Barrido, Limpieza e Higiene Urbana</span></a>
        <a href="/juzgado-faltas"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.4 4.2 6.4 6.4-1.8 1.8-.9-.9-3.9 3.9.8.8-1.8 1.8-6.4-6.4L7.6 9.8l.8.8 3.9-3.9-.8-.8 1.9-1.7ZM4 19h10v2H4v-2Z"/></svg><span>Juzgado de Faltas</span></a>
        <a href="https://www.municipalidad.com/fray/deuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14v11H5V9Zm1-5h12l2 4H4l2-4Zm2 8v2h8v-2H8Zm0 4v2h5v-2H8Z"/></svg><span>Tasa de Seguridad e Higiene</span></a>
        <a href="https://www.municipalidad.com/fray/deuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6V3Zm2 3v3h3V6H8Zm5 1v2h3V7h-3Zm-5 5v2h8v-2H8Zm0 4v2h6v-2H8Z"/></svg><span>Tasa Personal</span></a>
        <a href="https://www.municipalidad.com/fray/deuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 0 6 2.3 6 5.5 0 4.7-6 11.5-6 11.5S6 13.2 6 8.5C6 5.3 9 3 12 3Zm-4 15h8v2H8v-2Z"/></svg><span>Cobertura Integral de Sepelio</span></a>
        <a href="https://www.municipalidad.com/fray/deuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Zm3 3v3h3V7H8Zm0 6v2h8v-2H8Zm0 4h6v-2H8v2Zm5-9h3V6h-3v2Z"/></svg><span>Contribución Escuela Municipal</span></a>
        <a href="https://www.municipalidad.com/fray/deuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h4v3H8V9Zm6 0h2v6h-2V9Zm-6 5h4v1H8v-1Z"/></svg><span>Obras Privadas</span></a>
      </div>
      <a class="button" href="/rentas">Consultar deuda y pagar</a>
    </section>

    <section class="section" id="noticias" hidden>
      <div class="section-heading">
        <p class="kicker">Actualidad</p>
        <h2>Noticias municipales</h2>
      </div>
      <div class="news-list">
        <article class="news-card featured">
          <img src="/assets/optimized/fme-01.jpg" alt="Iglesia histórica de Fray Mamerto Esquiú" width="1200" height="617" loading="lazy" decoding="async">
          <div>
            <p>Obras y espacios públicos</p>
            <h3>Mejoras para disfrutar los puntos históricos del departamento</h3>
            <a href="/noticia-mejoras-puntos-historicos.html">Leer más</a>
          </div>
        </article>
        <article class="news-card">
          <img src="/assets/optimized/fme-10.jpg" alt="Edificio municipal" width="1200" height="800" loading="lazy" decoding="async">
          <div>
            <p>Gobierno</p>
            <h3>Nuevos canales digitales para agilizar consultas vecinales</h3>
            <a href="/noticia-canales-digitales.html">Ver novedad</a>
          </div>
        </article>
        <article class="news-card">
          <img src="/assets/optimized/fme-05.jpg" alt="Vista institucional de Fray Mamerto Esquiú" width="1200" height="249" loading="lazy" decoding="async">
          <div>
            <p>Comunidad</p>
            <h3>Agenda de actividades culturales, deportivas y recreativas</h3>
            <a href="/noticia-agenda-actividades.html">Ver agenda</a>
          </div>
        </article>
      </div>
    </section>

    <section class="services" id="agenda" hidden>
      <div class="section-heading">
        <p class="kicker">Servicios</p>
        <h2>Trámites y servicios más consultados</h2>
      </div>
      <div class="service-grid">
        <a href="#">Habilitaciones comerciales</a>
        <a href="#">Licencia de conducir</a>
        <a href="#">Catastro y obras privadas</a>
        <a href="/rentas">Dirección de Rentas</a>
        <a href="#">Defensa del consumidor</a>
        <a href="#">Turismo y patrimonio</a>
      </div>
    </section>

    <section class="open-government" id="gobierno-abierto">
      <div class="section-heading">
        <p class="kicker">Gobierno Abierto</p>
        <h2>Transparencia e información pública</h2>
      </div>

      <div class="open-government-grid">
        <article class="open-government-card">
          <div class="document-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6V2Zm8 2.8V8h3.2L14 4.8ZM8.5 11.5v2h7v-2h-7Zm0 4v2h9v-2h-9Z"/></svg>
          </div>
          <div>
            <span>Información oficial</span>
            <h3>Boletín Municipal</h3>
            <p>Consultá decretos, resoluciones, ordenanzas y demás publicaciones oficiales.</p>
          </div>
          <a class="button" href="/boletin">Consultar boletines</a>
        </article>

        <article class="open-government-card">
          <div class="document-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 4h16v4H4V4Zm0 6h16v10H4V10Zm3 3v2h5v-2H7Zm0 3v2h10v-2H7Z"/></svg>
          </div>
          <div>
            <span>Compras y procesos</span>
            <h3>Contrataciones Públicas</h3>
            <p>Consultá licitaciones, concursos de precios y contrataciones públicas del Municipio.</p>
          </div>
          <a class="button" href="/contrataciones.html">Consultar contrataciones</a>
        </article>

        <article class="open-government-card">
          <div class="document-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6V2Zm8 2.8V8h3.2L14 4.8ZM9 12h6v2H9v-2Zm0 4h6v2H9v-2Z"/></svg>
          </div>
          <div>
            <span>Marco institucional</span>
            <h3>Carta Orgánica Municipal</h3>
            <p>Conocé la norma fundamental que establece la organización, competencias y funcionamiento del Municipio.</p>
          </div>
          <a class="button" href="https://lideresmunicipales.cippec.org/web/archivos/uploads/2015/02/03-Fray-Mamerto-Esquiu-Catamarca-Carta-Organica.pdf">Conocer carta orgánica</a>
        </article>
      </div>

      <section class="open-dashboard" aria-label="Dashboard de infracciones de tránsito">
        <div>
          <span>Datos abiertos</span>
          <h3>Infracciones de tránsito en Fray Mamerto Esquiú</h3>
          <p>Consultá información y estadísticas sobre las infracciones de tránsito registradas en Fray Mamerto Esquiú.</p>
        </div>
        <div class="dashboard-frame">
          <iframe width="600" height="338" src="https://datastudio.google.com/embed/reporting/5035257c-ecbc-4f6c-8a74-d1b02c760c4a/page/kTItD" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
        </div>
      </section>
    </section>

    <section class="mayor" id="gobierno">
      <img src="/assets/optimized/intendenta-benavidez.jpeg" alt="Autoridad municipal de Fray Mamerto Esquiú" width="1380" height="1600" loading="lazy" decoding="async">
      <div>
        <p class="kicker">Gobierno municipal</p>
        <h2>Gestión cercana, información clara.</h2>
        <p>Conocé las autoridades municipales, las áreas de gobierno y cómo se organiza la gestión de Fray Mamerto Esquiú.</p>
        <a class="button" href="/gabinete.html">Conocer el gabinete</a>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <img src="/assets/optimized/fme-04.png" alt="" width="1024" height="684" loading="lazy" decoding="async">
    <p>Municipalidad de Fray Mamerto Esquiú</p>
    <a href="https://fraymunicipalidad.gob.ar">fraymunicipalidad.gob.ar</a>
  </footer>
`;

export default function Home() {
    useEffect(() => {
        const menuButton =
            document.querySelector<HTMLButtonElement>('.menu-toggle');
        const nav = document.querySelector<HTMLElement>('.main-nav');

        if (!menuButton || !nav) {
            return;
        }

        const onMenuClick = () => {
            const isOpen = nav.classList.toggle('open');
            menuButton.setAttribute('aria-expanded', String(isOpen));
        };

        const onNavClick = (event: Event) => {
            if (event.target instanceof HTMLAnchorElement) {
                nav.classList.remove('open');
                menuButton.setAttribute('aria-expanded', 'false');
            }
        };

        menuButton.addEventListener('click', onMenuClick);
        nav.addEventListener('click', onNavClick);

        return () => {
            menuButton.removeEventListener('click', onMenuClick);
            nav.removeEventListener('click', onNavClick);
        };
    }, []);

    return (
        <>
            <Head title="Municipalidad de Fray Mamerto Esquiú">
                <meta
                    name="description"
                    content="Sitio web de la Municipalidad de Fray Mamerto Esquiú."
                />
                <link
                    rel="preload"
                    as="image"
                    href="/assets/optimized/slider1.jpg"
                />
                <link rel="stylesheet" href="/styles.css" />
            </Head>

            <div dangerouslySetInnerHTML={{ __html: homeMarkup }} />
        </>
    );
}
