import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { BookOpenText, CircleDollarSign, Scale, UserRoundPlus } from 'lucide-react';

const lawBase = 'https://fraymunicipalidad.gob.ar/archivos/legislacion';

type Law = {
    kind: string;
    title: string;
    meta: string;
    href: string;
    featured?: boolean;
};

type TaxDetail = [string, string];

type Tax =
    | {
          title: string;
          details: TaxDetail[];
          note: string;
          action?: never;
      }
    | {
          title: string;
          details: TaxDetail[];
          note: string;
          action: {
              label: string;
              href: string;
              description: string;
          };
      };

function hasTaxAction(tax: Tax): tax is Extract<Tax, { action: unknown }> {
    return 'action' in tax && typeof tax.action !== 'undefined';
}

const laws: Law[] = [
    {
        kind: 'Resolución',
        title: 'VENCIMIENTOS 2026',
        meta: 'RS-2026-00000522-MUNIFMESQ-DR-SH · 02/01/2026',
        href: '/assets/rentas/vencimientos-2026.pdf',
        featured: true,
    },
    {
        kind: 'Resolución',
        title: 'ORDENANZA IMPOSITIVA 2026',
        meta: 'ACTA-2025-00058226-MUNIFMESQ-HCD · 02/01/2026',
        href: `${lawBase}/ACTA-2025-00058226-MUNIFMESQ-HCD.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'ORDENANZA IMPOSITIVA 2025',
        meta: 'ORDE-2024-1437-E-MUNIFMESQ-HCD · 26/12/2024',
        href: `${lawBase}/ORDE-2024-1437-E-MUNIFMESQ-HCD.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'CODIGO TRIBUTARIO 2024',
        meta: 'ORDE-2023-00068397-MUNIFMESQ-HCD · 22/12/2023',
        href: `${lawBase}/ORDE-2023-00068397-MUNIFMESQ-HCD.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'ORDENANZA IMPOSITIVA 2024',
        meta: 'ORDE-2023-00068190-MUNIFMESQ-HCD · 26/12/2023',
        href: `${lawBase}/ORDE-2023-00068190-MUNIFMESQ-HCD.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'ORDENANZA IMPOSITIVA 2022',
        meta: '1362-2022 · 17/03/2022',
        href: `${lawBase}/1362-2022.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'ORDENANZA - MODIFICACION DEL ART. 36º DE ORDENANZA IMPOSITIVA Nº 1362-2022',
        meta: '1386-2022 · 15/09/2022',
        href: `${lawBase}/1386-2022.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'ORDENANZA - MODIFICACION CODIGO TRIBUTARIO 1089-2014',
        meta: '1319-2020 · 03/09/2020',
        href: `${lawBase}/1319-2020.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'TASA SEGURIDAD E HIGIENE 1ERA PRORROGA PERIODO FISCAL ENERO 2024',
        meta: '1194-2017 · 17/08/2017',
        href: `${lawBase}/1194-2017.pdf`,
    },
    {
        kind: 'Ordenanza',
        title: 'CODIGO TRIBUTARIO 2014',
        meta: '1089-2014 · 19/06/2014',
        href: `${lawBase}/1089-2014.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'RESOLUCIÓN PARA EXTENDER LA FECHA DE VENCIMIENTO DEL PRIMER ANTICIPO PARA EXTINGUIR EL TRIBUTO TASA DE BARRIDO, LIMPIEZA E HIGIENE URBANA',
        meta: 'RS-2025-00013805-MUNIFMESQ-DR_SH · 27/03/2025',
        href: `${lawBase}/RS-2025-00013805-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'LUGAR MODO Y MEDIO DE PAGO DE OBLIGACIONES TRIBUTARIAS 2025',
        meta: 'RS-2025-00001159-MUNIFMESQ-DR_SH · 08/01/2025',
        href: `${lawBase}/RS-2025-00001159-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'VENCIMIENTOS, DESCUENTOS Y REQUISITOS FORMALES PARA EL CUMPLIMIENTO DE LAS OBLIGACIONES TRIBUTARIAS 2025',
        meta: 'RS-2025-00001503-MUNIFMESQ-DR_SH · 10/01/2025',
        href: `${lawBase}/RS-2025-00001503-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'NOMENCLADOR DE ACTIVIDADES TRIBUTO TASA DE SEGURIDAD E HIGIENE 2024',
        meta: 'RS-2024-00002667-MUNIFMESQ-DR_SH · 26/01/2024',
        href: `${lawBase}/RS-2024-00002667-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'MODOS LUGARES DE PAGO OBLIGACIONES TRIBUTARIAS 2024',
        meta: 'RS-2024-00002699-MUNIFMESQ-DR_SH · 29/01/2024',
        href: `${lawBase}/RS-2024-00002699-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'VENCIMIENTOS, DESCUENTOS Y REQUISITOS FORMALES PARA EL CUMPLIMIENTO DE LAS OBLIGACIONES TRIBUTARIAS 2024',
        meta: 'RS-2024-00002718-MUNIFMESQ-DR_SH · 29/01/2024',
        href: `${lawBase}/RS-2024-00002718-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'REGIMEN INFORMATIVO TASA DE VERIFICACION POR EL EMPLAZAMIENTO DE ESTRUCTURAS DE ANTENAS DE COMUNICACIONES MOVILES Y SUS INFRAESTRUCTURAS RELACIONADAS',
        meta: 'RS-2024-00002968-MUNIFMESQ-DR_SH · 31/01/2024',
        href: `${lawBase}/RS-2024-00002968-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'MODIFICACION ARTICULO 6° Y 7° RESOL-2024-3-E-MUNIFMESQ-DR#SH',
        meta: 'RS-2024-00006294-MUNIFMESQ-DR_SH · 21/02/2024',
        href: `${lawBase}/RS-2024-00006294-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'CLAVE FISCAL Y FORMULARIO ANEXO',
        meta: 'RS-2024-00007660-MUNIFMESQ-DR_SH · 28/02/2024',
        href: `${lawBase}/RS-2024-00007660-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'TASA DE SEGURIDAD E HIGIENE 2DA PRORROGA PERIODO FISCAL ENERO 2024',
        meta: 'RS-2024-00011000-MUNIFMESQ-DR_SH · 19/03/2024',
        href: `${lawBase}/RS-2024-00011000-MUNIFMESQ-DR_SH.pdf`,
    },
    {
        kind: 'Resolución',
        title: 'FORMULARIO 01 Y ANEXO',
        meta: 'RS-2024-00012455-MUNIFMESQ-DR_SH · 26/03/2024',
        href: `${lawBase}/RS-2024-00012455-MUNIFMESQ-DR_SH.pdf`,
    },
];

const taxes: Tax[] = [
    {
        title: 'Barrido, Limpieza e Higiene Urbana',
        details: [
            ['Anticipo 1', '31/03/2026'],
            ['Anticipo 2', '29/05/2026'],
            ['Anticipo 3', '31/08/2026'],
            ['Anticipo 4', '30/10/2026'],
        ],
        note: 'Pago anual anticipado con descuento del 25% hasta el primer vencimiento, sujeto a requisitos.',
    },
    {
        title: 'Seguridad e Higiene',
        details: [
            ['Ene', '20/02'],
            ['Feb', '20/03'],
            ['Mar', '20/04'],
            ['Abr', '20/05'],
            ['May', '22/06'],
            ['Jun', '20/07'],
            ['Jul', '20/08'],
            ['Ago', '21/09'],
            ['Sep', '20/10'],
            ['Oct', '23/11'],
            ['Nov', '21/12'],
            ['Dic', '20/01'],
        ],
        note: 'Incluye declaraciones juradas determinativas, informativas y extinción mensual del tributo.',
        action: {
            label: 'Empadronamiento de contribuyentes',
            href: 'https://municipalidad.com/fray/etramites/verguia?idTipoTramiteDet=11',
            description: 'Trámite de alta para la tasa de Seguridad e Higiene.',
        },
    },
    {
        title: 'Verificación',
        details: [['Servicios públicos y otros servicios', 'día 10 del mes siguiente']],
        note: 'El vencimiento cae el día 10 del mes inmediato siguiente al período fiscal.',
    },
    {
        title: 'Vehicular',
        details: [['Hecho imponible', 'al solicitar el servicio']],
        note: 'Vence al momento de solicitar el servicio que produce el hecho imponible.',
    },
    {
        title: 'Servicios diversos',
        details: [['Autorización', '30 días hábiles']],
        note: 'Vence a los 30 días hábiles posteriores a la resolución de autorización.',
    },
    {
        title: 'Cementerio',
        details: [
            ['Nichos', '31/03/2026'],
            ['Mausoleos y panteones', '31/03/2026'],
            ['Otros hechos imponibles', '5 días hábiles posteriores'],
        ],
        note: 'Vencimientos diferenciales según el tipo de obligación.',
    },
    {
        title: 'Antenas',
        details: [
            ['Construcción y registración', '5 días hábiles posteriores a la habilitación'],
            ['Verificación - Anticipo 1', '31/03/2026'],
            ['Verificación - Anticipo 2', '30/04/2026'],
            ['Verificación - Anticipo 3', '01/06/2025'],
        ],
        note: 'Incluye construcción, registración y anticipos de verificación.',
    },
];

export default function Rentas() {
    useEffect(() => {
        const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
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
            <Head title="Rentas">
                <meta
                    name="description"
                    content="Consulta de tasas, pagos, legislación y vencimientos de la Dirección de Rentas Municipal."
                />
                <link rel="stylesheet" href="/styles.css" />
            </Head>

            <div>
                <header className="site-header">
                    <Link className="brand" href="/" aria-label="Inicio">
                        <img
                            src="/assets/optimized/fme-04.png"
                            alt="Fray Municipalidad"
                            width="1024"
                            height="684"
                            decoding="async"
                        />
                    </Link>
                    <button
                        className="icon-button menu-toggle"
                        type="button"
                        aria-label="Abrir menú"
                        aria-expanded="false"
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                    <nav className="main-nav" aria-label="Menu principal">
                        <a href="/#gobierno-abierto">Gobierno Abierto</a>
                        <a href="/#parque-botanico">Parque Botánico</a>
                        <a href="/rentas">Rentas</a>
                        <a href="/gabinete.html">Gobierno</a>
                    </nav>
                </header>

                <main>
                    <section className="page-hero rentas-hero">
                        <p className="kicker">Dirección de Rentas</p>
                        <h1>Tasas y pagos</h1>
                        <p>
                            Consultá obligaciones tributarias, medios de pago,
                            legislación vigente y vencimientos 2026 según cada
                            tasa municipal.
                        </p>
                    </section>

                    <section className="open-government rentas-access" aria-labelledby="rentas-accesos-title">
                        <div className="section-heading">
                            <p className="kicker">Accesos rápidos</p>
                            <h2 id="rentas-accesos-title">Consultas, trámites y normativa</h2>
                        </div>

                        <div className="open-government-grid">
                            <article className="open-government-card">
                                <div className="document-icon" aria-hidden="true">
                                    <CircleDollarSign className="h-6 w-6" />
                                </div>
                                <div>
                                    <span>Pagos y consultas</span>
                                    <h3>Consultas y pagos</h3>
                                    <p>Ingresá con nomenclatura, padrón o CUIT para ver y pagar tus tasas.</p>
                                </div>
                                <a className="button" href="https://www.municipalidad.com/fray/deuda" target="_blank" rel="noreferrer">
                                    Ir al portal
                                </a>
                            </article>

                            <article className="open-government-card">
                                <div className="document-icon" aria-hidden="true">
                                    <UserRoundPlus className="h-6 w-6" />
                                </div>
                                <div>
                                    <span>Tasa de Seguridad e Higiene</span>
                                    <h3>Empadronamiento de contribuyentes</h3>
                                    <p>Acceso a la guía del trámite de alta para contribuyentes.</p>
                                </div>
                                <a className="button" href="https://municipalidad.com/fray/etramites/verguia?idTipoTramiteDet=11" target="_blank" rel="noreferrer">
                                    Iniciar trámite
                                </a>
                            </article>

                            <article className="open-government-card">
                                <div className="document-icon" aria-hidden="true">
                                    <BookOpenText className="h-6 w-6" />
                                </div>
                                <div>
                                    <span>Marco legal</span>
                                    <h3>Normativa tributaria</h3>
                                    <p>Ordenanzas y resoluciones vigentes del área de rentas.</p>
                                </div>
                                <a className="button" href="#normativa">
                                    Ver normativa
                                </a>
                            </article>
                        </div>
                    </section>

                    <section className="tax-calendar tax-calendar-compact">
                        <div className="section-heading">
                            <p className="kicker">Calendario tributario</p>
                            <h2>Vencimientos 2026</h2>
                        </div>

                        <div className="tax-grid">
                            {taxes.map((tax) => (
                                <article className="tax-card compact-tax" key={tax.title}>
                                    <div className="tax-card-head">
                                        <span>Tasa</span>
                                        <h3>{tax.title}</h3>
                                    </div>

                                    <div className="due-list">
                                        {tax.details.map(([label, due]) => (
                                            <div key={`${tax.title}-${label}`}>
                                                <strong>{label}</strong>
                                                <span>{due}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <p>{tax.note}</p>

                                    {hasTaxAction(tax) ? (
                                        <div>
                                            <a
                                                className="outline-light"
                                                href={tax.action.href}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {tax.action.label}
                                            </a>
                                            <p style={{ marginTop: 8 }}>
                                                {tax.action.description}
                                            </p>
                                        </div>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="legislation-section" id="normativa">
                        <div className="section-heading">
                            <p className="kicker">Normativa</p>
                            <h2>Legislación tributaria</h2>
                        </div>

                        <div className="legislation-grid">
                            {laws.map((law) => (
                                <article
                                    className={`legislation-card${law.featured ? ' featured-law' : ''}`}
                                    key={`${law.kind}-${law.title}`}
                                >
                                    <span>{law.kind}</span>
                                    <h3>{law.title}</h3>
                                    <p>{law.meta}</p>
                                    <a href={law.href} target="_blank" rel="noreferrer">
                                        {law.featured ? 'Descargar PDF' : 'Ver PDF'}
                                    </a>
                                </article>
                            ))}
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
                    <Link href="/">Volver al inicio</Link>
                </footer>
            </div>
        </>
    );
}
