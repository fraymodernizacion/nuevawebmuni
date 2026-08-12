import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Download, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const bulletinMonthsByYear: Record<number, number[]> = {
    2026: [1, 2, 3, 4, 5, 6, 7, 8],
    2025: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2024: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2023: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2022: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2021: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2020: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2019: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2018: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2017: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2016: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long' });

type Bulletin = {
    year: number;
    month: number;
    number: string;
    monthLabel: string;
    href: string;
};

function formatMonth(month: number) {
    const label = monthFormatter.format(new Date(2026, month - 1, 1));

    return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatBulletinNumber(year: number, month: number) {
    return `${String(month).padStart(2, '0')}-${year}`;
}

function getBulletinHref(year: number, month: number) {
    return `/assets/boletin-oficial/boletin-oficial-${year}-${String(month).padStart(2, '0')}.pdf?v=20260812`;
}

export default function Boletin() {
    const years = Object.keys(bulletinMonthsByYear)
        .map(Number)
        .sort((firstYear, secondYear) => secondYear - firstYear);
    const [selectedYear, setSelectedYear] = useState<number>(years[0]);

    const bulletins = useMemo(
        () =>
            years.flatMap((year) =>
                [...bulletinMonthsByYear[year]]
                    .sort((firstMonth, secondMonth) => secondMonth - firstMonth)
                    .map((month) => {
                        const number = formatBulletinNumber(year, month);
                        const monthLabel = formatMonth(month);

                        return {
                            year,
                            month,
                            number,
                            monthLabel,
                            href: getBulletinHref(year, month),
                        };
                    }),
            ),
        [years],
    );

    const filteredBulletins = bulletins.filter((bulletin) => {
        return bulletin.year === selectedYear;
    });

    const groupedBulletins = years
        .map((year) => ({
            year,
            bulletins: filteredBulletins.filter(
                (bulletin) => bulletin.year === year,
            ),
        }))
        .filter((group) => group.bulletins.length > 0);

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
            <Head title="Boletín Oficial">
                <meta
                    name="description"
                    content="Boletín Oficial de la Municipalidad de Fray Mamerto Esquiú organizado por año y mes."
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
                    <section className="page-hero" id="top">
                        <p className="kicker">Información oficial</p>
                        <h1>Boletín Oficial</h1>
                        <p>
                            Archivo de publicaciones oficiales de la
                            Municipalidad de Fray Mamerto Esquiú.
                        </p>
                    </section>

                    <section className="bulletin bulletin-page">
                        <div className="bulletin-tools">
                            <label className="bulletin-year-select">
                                <span>Año</span>
                                <select
                                    value={selectedYear}
                                    onChange={(event) => {
                                        setSelectedYear(
                                            Number(event.target.value),
                                        );
                                    }}
                                >
                                    {years.map((year) => (
                                        <option value={year} key={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="bulletin-layout">
                            <aside
                                className="bulletin-year-nav"
                                aria-label="Filtrar por año"
                            >
                                {years.map((year) => (
                                    <button
                                        type="button"
                                        className={
                                            selectedYear === year
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() => {
                                            setSelectedYear(year);
                                        }}
                                        key={year}
                                    >
                                        <span>{year}</span>
                                        <strong>
                                            {bulletinMonthsByYear[year].length}
                                        </strong>
                                    </button>
                                ))}
                            </aside>

                            <div className="bulletin-results">
                                <div className="bulletin-results-head">
                                    <div>
                                        <p>Filtro activo: {selectedYear}</p>
                                    </div>
                                </div>

                                {groupedBulletins.length > 0 ? (
                                    groupedBulletins.map((group) => (
                                        <section
                                            className="bulletin-year-group"
                                            aria-labelledby={`title-${group.year}`}
                                            key={group.year}
                                        >
                                            <div className="bulletin-year-heading">
                                                <h3 id={`title-${group.year}`}>
                                                    {group.year}
                                                </h3>
                                                <span>
                                                    {group.bulletins.length}{' '}
                                                    {group.bulletins.length ===
                                                    1
                                                        ? 'archivo'
                                                        : 'archivos'}
                                                </span>
                                            </div>

                                            <div className="bulletin-file-list">
                                                {group.bulletins.map(
                                                    (bulletin) => (
                                                        <BulletinRow
                                                            bulletin={bulletin}
                                                            key={
                                                                bulletin.number
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </section>
                                    ))
                                ) : (
                                    <div className="bulletin-empty">
                                        <FileText aria-hidden="true" />
                                        <h3>No encontramos boletines</h3>
                                        <p>Probá con otro año o mes.</p>
                                    </div>
                                )}
                            </div>
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

function BulletinRow({ bulletin }: { bulletin: Bulletin }) {
    return (
        <article className="bulletin-row">
            <div className="bulletin-row-icon" aria-hidden="true">
                <FileText />
            </div>
            <div className="bulletin-row-main">
                <span>Boletín Oficial</span>
                <h3>N° {bulletin.number}</h3>
                <p>
                    {bulletin.monthLabel} {bulletin.year}
                </p>
            </div>
            <div className="bulletin-row-actions">
                <a href={bulletin.href} target="_blank" rel="noreferrer">
                    <ArrowUpRight aria-hidden="true" />
                    Ver PDF
                </a>
                <a href={bulletin.href} download>
                    <Download aria-hidden="true" />
                    Descargar
                </a>
            </div>
        </article>
    );
}
