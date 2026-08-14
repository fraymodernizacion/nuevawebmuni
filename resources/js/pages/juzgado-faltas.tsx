import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

const actionAreas = [
    {
        title: 'Tránsito',
        description:
            'Infracciones vehiculares, exceso de velocidad, estacionamiento indebido y alcoholemia positiva, entre otras.',
        icon: 'M4 15h1.2l1.2-4.5A3 3 0 0 1 9.3 8h5.4a3 3 0 0 1 2.9 2.5l1.2 4.5H20v5h-2v-2H6v2H4v-5Zm4.2-4.4-.8 3.1h9.2l-.8-3.1a1.2 1.2 0 0 0-1.1-.8H9.3a1.2 1.2 0 0 0-1.1.8ZM7 15.7a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm10 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z',
    },
    {
        title: 'Sanidad Ambiental',
        description:
            'Vertido de residuos en espacios públicos y ruidos molestos, entre otras situaciones.',
        icon: 'M7 4h10v3h3v2h-2.2l-1.4 11H7.6L6.2 9H4V7h3V4Zm2.2 5 1 9h3.6l1-9H9.2ZM10 2h4v2h-4V2Z',
    },
    {
        title: 'Inspección General y Comercios',
        description:
            'Falta de habilitación comercial e incumplimiento de normas sanitarias.',
        icon: 'M5 5h14l2 5v2h-1v8H4v-8H3v-2l2-5Zm1.3 2-1.2 3h13.8l-1.2-3H6.3ZM6 12v6h12v-6H6Zm2 2h4v3H8v-3Z',
    },
    {
        title: 'Bromatología',
        description:
            'Control de alimentos y condiciones de higiene en locales gastronómicos.',
        icon: 'M7 3h2v7a3 3 0 0 1-2 2.8V21H5v-8.2A3 3 0 0 1 3 10V3h2v7h2V3Zm8 0c3 1.2 5 4.1 5 7.5 0 3-1.3 5.4-3.4 6.8V21h-2v-3h-.1A7.8 7.8 0 0 1 12 10.5C12 7.1 13.4 4.3 15 3Zm1.6 3.7a7 7 0 0 0-1.1 3.8c0 2 .7 3.8 1.5 4.7.6-1.1 1-2.7 1-4.7 0-1.5-.5-2.8-1.4-3.8Z',
    },
    {
        title: 'Obras Particulares',
        description:
            'Por incumplimiento de las normas del Plan Urbano Territorial.',
        icon: 'M4 20h16v-2H4v2Zm2-4h12V8.8L12 4 6 8.8V16Zm2-2v-4.2l4-3.2 4 3.2V14h-3v-3h-2v3H8Z',
    },
];

const procedure = [
    ['Notificación', 'El infractor recibe una citación o acta de infracción.'],
    ['Descargo', 'Puede presentar pruebas y realizar su defensa.'],
    [
        'Resolución',
        'Se emite una sentencia con la posible aplicación de una sanción.',
    ],
    ['Pago o Apelación', 'Se puede abonar la multa o recurrir la decisión.'],
];

const paymentSteps = [
    'Ingresá a municipalidad.com/fray/deuda.',
    'Buscá la sección Juzgado de Faltas.',
    'En Tipo de acta, seleccioná Tránsito.',
    'Ingresá el número de acta que figura en tu multa.',
    'Presioná Aceptar.',
];

export default function JuzgadoFaltas() {
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
            <Head title="Juzgado Administrativo Municipal de Faltas">
                <meta
                    name="description"
                    content="Información del Juzgado Administrativo Municipal de Faltas de Fray Mamerto Esquiú: autoridades, procedimiento, áreas de actuación y contacto."
                />
                <link rel="stylesheet" href="/styles.css" />
            </Head>

            <header className="site-header">
                <a className="brand" href="/" aria-label="Inicio">
                    <img
                        src="/assets/optimized/fme-04.png"
                        alt="Fray Municipalidad"
                        width="1024"
                        height="684"
                        decoding="async"
                    />
                </a>
                <button
                    className="icon-button menu-toggle"
                    type="button"
                    aria-label="Abrir menú"
                    aria-expanded="false"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <nav className="main-nav" aria-label="Menu principal">
                    <a href="/">Inicio</a>
                    <a href="/rentas">Rentas</a>
                    <a href="/gabinete.html">Gobierno</a>
                </nav>
            </header>

            <main className="faults-page">
                <section className="page-hero faults-hero">
                    <p className="kicker">Convivencia y normas</p>
                    <h1>Juzgado Administrativo Municipal de Faltas</h1>
                    <p>
                        Órgano encargado de juzgar y sancionar las infracciones
                        cometidas dentro del ejido municipal, en cumplimiento de
                        las normativas vigentes.
                    </p>
                </section>

                <section
                    className="faults-areas"
                    aria-labelledby="faults-areas-title"
                >
                    <div className="section-heading">
                        <p className="kicker">Áreas de actuación</p>
                        <h2 id="faults-areas-title">
                            Infracciones en las que interviene
                        </h2>
                    </div>
                    <div className="faults-area-grid">
                        {actionAreas.map((area) => (
                            <article key={area.title}>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d={area.icon} />
                                </svg>
                                <div>
                                    <h3>{area.title}</h3>
                                    <p>{area.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section
                    className="faults-procedure"
                    aria-labelledby="faults-procedure-title"
                >
                    <div className="section-heading">
                        <p className="kicker">Procedimiento</p>
                        <h2 id="faults-procedure-title">
                            Cómo continúa una infracción
                        </h2>
                    </div>
                    <ol>
                        {procedure.map(([title, description]) => (
                            <li key={title}>
                                <strong>{title}</strong>
                                <p>{description}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section
                    className="faults-payment"
                    aria-labelledby="faults-payment-title"
                >
                    <div className="section-heading">
                        <p className="kicker">Consulta y pago online</p>
                        <h2 id="faults-payment-title">
                            Consultá y pagá multas de tránsito
                        </h2>
                    </div>
                    <div className="faults-payment-layout">
                        <ol>
                            {paymentSteps.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>
                        <article>
                            <h3>Monto y pago online</h3>
                            <p>
                                Al finalizar la consulta vas a poder ver el
                                monto a pagar y generar el pago online.
                            </p>
                            <a
                                className="button"
                                href="https://www.municipalidad.com/fray/deuda"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Consulta y pago de multas
                            </a>
                        </article>
                    </div>
                </section>

                <section
                    className="faults-debt"
                    aria-labelledby="faults-debt-title"
                >
                    <article className="faults-service-card">
                        <span>Trámite presencial o virtual</span>
                        <h2 id="faults-debt-title">
                            Libre deuda de infracciones municipal
                        </h2>
                        <p>
                            En el Juzgado Administrativo Municipal de Faltas se
                            puede solicitar el libre deuda de infracciones
                            municipal de manera presencial, por WhatsApp o por
                            correo electrónico. El tiempo de respuesta será en
                            días y horarios hábiles del juzgado.
                        </p>
                    </article>
                </section>

                <section
                    className="faults-contact-section"
                    aria-label="Atención del Juzgado de Faltas"
                >
                    <aside className="faults-contact-card">
                        <h2>Atención</h2>
                        <dl>
                            <div>
                                <dt>Dirección</dt>
                                <dd>
                                    Av. La Callecita s/n, San José de Piedra
                                    Blanca, Fray Mamerto Esquiú.
                                </dd>
                            </div>
                            <div>
                                <dt>WhatsApp</dt>
                                <dd>
                                    <a
                                        href="https://wa.me/543834195730"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        383-4195730
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt>Correo electrónico</dt>
                                <dd>
                                    <a href="mailto:juzgadomunicipal@fraymunicipalidad.gob.ar">
                                        juzgadomunicipal@fraymunicipalidad.gob.ar
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt>Horario de atención</dt>
                                <dd>Lunes a viernes de 7.00 a 13.00 hs.</dd>
                            </div>
                            <div>
                                <dt>Ubicación</dt>
                                <dd>
                                    <a
                                        href="https://maps.app.goo.gl/jXrEDoeKjeg87uB17"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Ver en Google Maps
                                    </a>
                                </dd>
                            </div>
                        </dl>
                        <div className="faults-contact-actions">
                            <a
                                className="button"
                                href="https://wa.me/543834195730"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Enviar WhatsApp
                            </a>
                            <a
                                className="outline-button"
                                href="mailto:juzgadomunicipal@fraymunicipalidad.gob.ar"
                            >
                                Enviar correo
                            </a>
                        </div>
                    </aside>
                </section>
                <section
                    className="faults-staff"
                    aria-labelledby="faults-staff-title"
                >
                    <div className="section-heading">
                        <p className="kicker">Organigrama</p>
                        <h2 id="faults-staff-title">Autoridades del área</h2>
                    </div>
                    <div className="faults-staff-grid">
                        <article className="faults-staff-featured">
                            <img
                                src="/assets/optimized/gabinete/image3.jpg"
                                alt="Dra. Natalia Santillán"
                                width="762"
                                height="1200"
                                loading="lazy"
                                decoding="async"
                            />
                            <div>
                                <span>Jueza</span>
                                <strong>Dra. Santillan Natalia Patricia</strong>
                                <p>Jueza Administrativa Municipal de Faltas</p>
                            </div>
                        </article>
                        <article>
                            <span>Secretaria</span>
                            <strong>Dra. Comelli Godoy Marianella</strong>
                            <p>
                                Secretaria del Juzgado Administrativo Municipal
                                de Faltas
                            </p>
                        </article>
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <img
                    src="/assets/optimized/fme-04.png"
                    alt=""
                    width="1024"
                    height="684"
                    loading="lazy"
                    decoding="async"
                />
                <p>Municipalidad de Fray Mamerto Esquiú</p>
                <a href="/">Volver al inicio</a>
            </footer>
        </>
    );
}
