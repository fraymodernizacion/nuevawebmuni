# Estructura y funcionamiento del sitio municipal

Este documento está pensado para que otro agente pueda entender rápido cómo está armado el sitio de la Municipalidad de Fray Mamerto Esquiú, qué archivos editar, cómo validar cambios y cómo preparar una publicación.

## Resumen ejecutivo

El proyecto tiene dos capas:

1. **Sitio municipal estático/local en la raíz del workspace**
   - Archivos principales: `index.html`, `styles.css`, `script.js`, `mesa-entrada.js`, páginas HTML sueltas y carpeta `assets/`.
   - Servidor local propio: `server.js`.
   - CMS/admin local basado en `data/cms.json`.

2. **Contenedor publicable de Sites en `chatgpt-site/`**
   - Es un proyecto Vinext/Next/React que sirve el sitio estático dentro de un iframe.
   - La copia publicable del sitio municipal está en `chatgpt-site/public/site/`.
   - La configuración de hosting está en `chatgpt-site/.openai/hosting.json`.

Regla práctica: cuando se cambia una página, estilo, script o asset del sitio municipal, normalmente hay que aplicar el mismo cambio en:

- raíz del workspace, por ejemplo `index.html`, `styles.css`, `assets/...`
- copia publicable, por ejemplo `chatgpt-site/public/site/index.html`, `chatgpt-site/public/site/styles.css`, `chatgpt-site/public/site/assets/...`

## Rutas y páginas principales

### Home

Archivo raíz:

- `index.html`

Copia publicable:

- `chatgpt-site/public/site/index.html`

Estructura actual de la home:

- `header.site-header`: logo y navegación principal.
- `section.hero`: hero con imagen de fondo `assets/optimized/slider1.jpg`.
- `section.useful-phones`: teléfonos útiles de WhatsApp.
- `section.service-banner`: acceso al Servicio de Sepelio San José.
- `section.botanical-section#parque-botanico`: bloque Parque Botánico.
- `section.payment-landing`: consulta y pago de tasas.
- `section#noticias`: tarjetas de noticias.
- `section#agenda`: agenda/servicios.
- `section#gobierno-abierto`: gobierno abierto, boletín, contrataciones y dashboard.
- `section.mayor#gobierno`: intendenta/gobierno.
- footer con logo.

Nota reciente: se quitaron de la home los accesos rápidos `Trámites online`, `Turnos`, `Reclamos`, `Tasas y pagos` y la franja `Atención al vecino`.

### Mesa de Entrada Virtual

Archivos:

- `mesa-entrada.html`
- `mesa-entrada.js`
- mocks en `mock/`

Copia publicable:

- `chatgpt-site/public/site/mesa-entrada.html`
- `chatgpt-site/public/site/mesa-entrada.js`
- `chatgpt-site/public/site/mock/`

Funcionalidad:

- App multipantalla con vistas marcadas por `data-view`.
- Catálogo de trámites desde `mock/mock-tramites.json`.
- Formularios dinámicos, identificación, consulta por tracking, adjuntos y perfil.
- Vista de operador en `#operador`.
- Puede consumir georef de Argentina mediante `https://apis.datos.gob.ar/georef/api/...`.
- Puede llamar endpoints locales para adjuntos y WhatsApp:
  - `POST /api/uploads/note`
  - `POST /api/operator/notify-whatsapp`
  - `POST /api/operator/notify-status-whatsapp`

### Gabinete y organigrama

Archivos:

- `gabinete.html`
- estilos relacionados en `styles.css`
- fotos en `assets/optimized/gabinete/`

Copia publicable:

- `chatgpt-site/public/site/gabinete.html`
- `chatgpt-site/public/site/styles.css`
- `chatgpt-site/public/site/assets/optimized/gabinete/`

Estructura:

- `cabinet-feature`: intendenta.
- `cabinet-section`: grilla superior de autoridades con fotos.
- `org-chart-section#organigrama`: estructura por áreas con `details.org-group`.

Notas recientes:

- Agustina Messeri y Lucas Perelló deben figurar con foto en la grilla superior de gabinete.
- En el organigrama inferior deben quedar como fichas destacadas de texto dentro de sus áreas.
- Las fichas destacadas usan `.org-people.org-people-featured article` para fondo azul oscuro y texto blanco. Esa especificidad evita que `.org-people article` pise el fondo.

### Rentas

Archivo:

- `rentas.html`

Incluye:

- Accesos a pago/consulta.
- Calendario tributario.
- Legislación.
- PDF en `assets/rentas/vencimientos-2026.pdf`.

### Sepelio San José

Archivo:

- `sepelio-san-jose.html`

Incluye:

- Información de planes, contacto, ubicación y pasos de pago.

### Boletín y contrataciones

Archivos públicos:

- `boletin.html`
- `contrataciones.html`

Paneles admin relacionados:

- `admin-boletines.html`
- `admin-contrataciones.html`

### Noticias

Páginas de noticias estáticas actuales:

- `noticia-agenda-actividades.html`
- `noticia-canales-digitales.html`
- `noticia-mejoras-puntos-historicos.html`

Panel admin:

- `admin-noticias.html`

El editor de noticias vive mayormente en `script.js`: preview, editor enriquecido, inserción de imágenes/carruseles/videos y generación de `srcdoc` para previsualizar una noticia publicada.

## Navegación y layout base

Todas las páginas públicas comparten patrón:

- `header.site-header`
- `a.brand` con logo `assets/optimized/fme-04.png`
- `button.menu-toggle`
- `nav.main-nav`
- `main`
- footer con logo en varias páginas
- `script.js` al final cuando corresponde

El menú móvil se abre/cierra desde `script.js` con:

- `.menu-toggle`
- `.main-nav`
- clase `.open`

## CSS y sistema visual

Archivo raíz:

- `styles.css`

Copia publicable:

- `chatgpt-site/public/site/styles.css`

Variables principales:

```css
:root {
  --blue: #2e75b8;
  --blue-dark: #123d67;
  --green: #84bd1a;
  --pink: #d93397;
  --ink: #202833;
  --muted: #667085;
  --line: #e5ebf0;
  --surface: #ffffff;
  --soft: #f3f7fb;
  --shadow: 0 18px 50px rgba(31, 48, 73, .16);
}
```

Convenciones:

- Mobile-first.
- Header sticky.
- Cards con radio de `8px`.
- Paleta institucional azul, verde y rosa.
- Imágenes con `display: block; max-width: 100%; height: auto;`.
- Accesibilidad básica con `focus-visible`.

Secciones de estilos importantes:

- Header/nav: inicio de `styles.css`.
- Home y bloques públicos: primeras secciones del CSS.
- Admin: clases tipo `.admin-*`.
- Login: `.login-*`.
- Gabinete/organigrama: `.cabinet-*`, `.org-*`.
- Mesa de entrada: `.mesa-*`, `.operator-*`.
- Media queries al final.

## Assets

Carpetas:

- `assets/`
- `assets/optimized/`
- `assets/optimized/gabinete/`
- `chatgpt-site/public/site/assets/`
- `chatgpt-site/public/site/assets/optimized/`

Logo actual:

- `assets/fme-04.png`
- `assets/optimized/fme-04.png`
- `chatgpt-site/public/site/assets/fme-04.png`
- `chatgpt-site/public/site/assets/optimized/fme-04.png`

El logo actual es PNG transparente de `1024 x 684`; las referencias HTML usan `width="1024" height="684"`.

Imágenes destacadas:

- Hero home: `assets/optimized/slider1.jpg`
- Intendenta: `assets/optimized/intendenta-benavidez.jpeg`
- Parque Botánico: `assets/optimized/parque-botanico.jpeg`
- Gabinete: `assets/optimized/gabinete/*.jpg`

Regla práctica: si se reemplaza un asset usado en producción, actualizar ambas copias y verificar dimensiones declaradas en HTML.

## Servidor local raíz

Archivo:

- `server.js`

Ejecución:

```bash
npm run dev
```

Puerto:

- `PORT` o `3000` por defecto.

Responsabilidades:

- Servir archivos estáticos desde la raíz.
- Proteger páginas admin.
- Gestionar login con cookie `session`.
- Leer/escribir `data/cms.json`.
- Recibir uploads en `uploads/notes/`.
- Integrarse con BuilderBot para WhatsApp si existen variables de entorno.

Variables de entorno relevantes:

- `PORT`
- `BUILDERBOT_ENDPOINT`
- `BUILDERBOT_TOKEN`

Usuarios iniciales si no existe `data/cms.json`:

- `admin@fraymunicipalidad.gob.ar`
- `prensa@fraymunicipalidad.gob.ar`
- `hacienda@fraymunicipalidad.gob.ar`
- `gobierno@fraymunicipalidad.gob.ar`

Contraseña inicial para todos:

- `Cambiar123!`

Roles:

- `super_admin`: noticias, organigrama, contrataciones, boletines, usuarios.
- `prensa`: noticias, organigrama.
- `hacienda`: contrataciones.
- `gobierno`: boletines.

Rutas admin protegidas:

- `/admin-noticias.html`
- `/admin-organigrama.html`
- `/admin-contrataciones.html`
- `/admin-boletines.html`
- `/admin-usuarios.html`

Endpoints:

- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/content/:section`
- `PUT /api/content/:section`
- `GET /api/users`
- `PUT /api/users`
- `POST /api/uploads/note`
- `POST /api/operator/notify-whatsapp`
- `POST /api/operator/notify-status-whatsapp`

Secciones válidas de CMS:

- `noticias`
- `organigrama`
- `contrataciones`
- `boletines`

## Datos locales y mocks

Archivo CMS:

- `data/cms.json`

Estructura:

```json
{
  "users": [],
  "content": {
    "noticias": [],
    "organigrama": [],
    "contrataciones": [],
    "boletines": []
  },
  "updatedAt": ""
}
```

Mocks:

- `mock/mock-tramites.json`: trámites y formularios.
- `mock/mock-faq.json`: preguntas frecuentes.
- `mock/mock-user.json`: usuario/perfil simulado.
- `mock/mock-instituciones.json`: instituciones/áreas.
- `mock/georef-provincias.json` y `mock/georef-fme.json`: datos geográficos locales.
- `mock/mock-dashboard.json`: datos de dashboard.
- `mock/mock-formularios.json`: formularios.
- `mock/mock-history.json`: historial.
- `mock/actividades-arca.json`: actividades ARCA.

## Scripts de frontend

### `script.js`

Usado por páginas públicas y paneles admin.

Funciones principales:

- Menú responsive.
- Login admin.
- Aplicación de permisos en menú admin.
- Editor enriquecido de noticias.
- Preview de noticia, boletín y formularios admin.
- Inserción y eliminación de medios.
- Lightbox público para imágenes.

### `mesa-entrada.js`

Usado por `mesa-entrada.html`.

Funciones principales:

- Navegación de vistas internas por `data-view`.
- Catálogo y búsqueda.
- Wizard de formulario.
- Identificación de vecino.
- Adjuntos.
- Consulta por tracking.
- Dashboard de operador.
- Derivación y notificación por WhatsApp.
- Mapa/georreferencia cuando corresponde.

## Proyecto publicable `chatgpt-site`

Carpeta:

- `chatgpt-site/`

Tecnologías:

- Vinext
- Next 16
- React 19
- Vite
- Cloudflare Workers/Sites

Archivos importantes:

- `chatgpt-site/app/page.tsx`: renderiza un iframe con `src="/site/index.html"`.
- `chatgpt-site/app/layout.tsx`: metadata/layout del contenedor.
- `chatgpt-site/app/globals.css`: estilos del contenedor/iframe.
- `chatgpt-site/public/site/`: copia publicable del sitio municipal.
- `chatgpt-site/.openai/hosting.json`: configuración de Sites.
- `chatgpt-site/vite.config.ts`: configuración Vinext/Vite.
- `chatgpt-site/worker/index.ts`: worker.

Hosting:

```json
{
  "project_id": "appgprj_6a733c45170081918c57e4a80cbd0612",
  "d1": null,
  "r2": null
}
```

Validación:

```bash
cd chatgpt-site
npm run build
```

La prueba `npm run test` existe, pero los tests actuales parecen corresponder al starter original de Sites y pueden no reflejar el estado real del sitio municipal. Para cambios habituales, el build es la validación mínima.

## Flujo recomendado para cambios

1. Identificar si el cambio afecta sólo una página, estilos, scripts o assets.
2. Editar la raíz del sitio municipal.
3. Repetir el cambio en `chatgpt-site/public/site/`.
4. Si se cambian imágenes, confirmar dimensiones y referencias HTML.
5. Ejecutar:

```bash
cd chatgpt-site
npm run build
```

6. Revisar que el cambio quede acotado:

```bash
cd chatgpt-site
git status --short
git diff
```

7. Si el usuario pide publicar, usar el flujo de Sites:
   - Commit en `chatgpt-site`.
   - Push con credencial de Sites.
   - Empaquetar con `scripts/package-site.sh`.
   - Guardar versión con Sites.
   - Desplegar sólo con aprobación explícita si el sitio es compartido/público.

## Estado reciente de cambios relevantes

Cambios ya realizados en esta sesión:

- Reubicación visual de Agustina Messeri y Lucas Perelló:
  - Arriba en la grilla de gabinete con foto.
  - Abajo en organigrama como fichas de texto destacadas.
- Corrección de contraste de fichas destacadas del organigrama.
- Reemplazo del logo municipal por PNG transparente sin fondo.
- Eliminación en home de:
  - `Trámites online`
  - `Turnos`
  - `Reclamos`
  - `Tasas y pagos`
  - bloque `Atención al vecino`

Los cambios se guardaron como versiones de Sites, pero no se desplegaron en producción porque el sitio no fue verificado como privado owner-only. Para desplegar en producción hace falta aprobación explícita del usuario.

## Advertencias para otros agentes

- No asumir que editar sólo la raíz alcanza para producción. La copia publicable está en `chatgpt-site/public/site/`.
- No borrar cambios del usuario. La raíz no es un repo Git; `chatgpt-site` sí.
- No usar `git reset --hard` ni revertir archivos sin indicación explícita.
- Cuidar nombres con acentos en HTML; el sitio está en español y usa UTF-8.
- Mantener el logo como PNG transparente y con proporción `1024 x 684` salvo que el usuario indique otra cosa.
- Si se toca `index.html`, revisar también links del nav: todavía existe un enlace a `#tramites`, aunque la sección de accesos rápidos fue retirada. Puede apuntar a otra sección si se decide renombrar anchors.
- Si se toca organigrama, revisar el CSS de `.org-people.org-people-featured article`; es intencional para evitar texto blanco sobre fondo blanco.
- Si se agrega una página nueva, replicar header/footer, enlazar `styles.css` y `script.js` si necesita menú móvil.
- Para publicar en Sites, no llamar `create_site` porque ya existe `project_id`.
