# Puesta en producción

## Estructura recomendada

El repositorio ahora está preparado para usar una carpeta pública:

```text
nuevawebmuni/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── mesa-entrada.js
│   ├── assets/
│   ├── mock/
│   └── uploads/
├── data/
├── server.js
└── package.json
```

Esto permite:

- servir la web estática con Nginx desde `public/`
- mantener `data/` fuera del docroot
- dejar el proyecto alineado con una futura migración a Laravel

## Prueba local

1. Instalar Node.js 18 o superior.
2. Abrir una terminal en la carpeta del proyecto.
3. Ejecutar:

```bash
npm start
```

4. Abrir:

```text
http://localhost:3000
```

El panel administrativo se protege desde el servidor. Si se intenta entrar a una página `admin-*.html` sin sesión, redirige a `login.html`.

El servidor local (`server.js`) sirve los archivos desde `public/`.

## Usuarios iniciales

Todos usan la contraseña inicial:

```text
Cambiar123!
```

Usuarios:

```text
admin@fraymunicipalidad.gob.ar      Super admin
prensa@fraymunicipalidad.gob.ar     Prensa
hacienda@fraymunicipalidad.gob.ar   Hacienda
gobierno@fraymunicipalidad.gob.ar   Gobierno
```

Permisos:

```text
Super admin: Noticias, Organigrama, Contrataciones, Boletines, Usuarios
Prensa: Noticias, Organigrama
Hacienda: Contrataciones
Gobierno: Boletines
```

## Para subir a una máquina virtual

Se necesita:

- VM con Linux, Node.js 18+ y usuario de despliegue.
- Dominio apuntando a la IP de la VM.
- HTTPS con Nginx o Caddy como proxy reverso.
- Variable `PORT` si no se usa el puerto 3000.
- Backups de la carpeta `data/` y de los archivos subidos en `public/uploads/`.
- Cambio obligatorio de contraseñas iniciales antes de publicar.
- Firewall habilitando solo `80`, `443` y SSH.

### Opción simple para VPS con Nginx

- clonar el repo en `/var/www/principal`
- usar `root /var/www/principal/public;`
- dejar `data/` fuera del docroot, dentro del repo

Durante la etapa estática, Nginx puede servir directamente `public/`. Si luego se migra a Laravel, se mantiene la misma idea de docroot en `public/`.

### Script de deploy recomendado

El proyecto incluye:

```text
scripts/deploy-vps.sh
```

Este script:

- entra al repo en `/var/www/principal`
- preserva `data/` y `public/uploads/`
- hace `git fetch` + `git pull --ff-only`
- restaura los datos runtime
- corrige permisos
- deja listo el paso manual final de Nginx

Uso:

```bash
cd /var/www/principal
sudo bash scripts/deploy-vps.sh
```

Opcionalmente:

```bash
sudo APP_DIR=/var/www/principal BRANCH=main bash scripts/deploy-vps.sh
```

Nota: el script ya no hace `chown`. Se recomienda dejar una sola vez el repo con:

```bash
sudo chown -R fme:www-data /var/www/principal
```

Luego ejecutar manualmente:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Datos

El backend local guarda la información en:

```text
data/cms.json
```

Esto sirve para probar el flujo completo en local. Para producción con mucho uso conviene migrar a una base de datos como PostgreSQL o SQLite con backups programados.

## Comando de producción sugerido

```bash
PORT=3000 npm start
```

En la VM, conviene ejecutarlo con `systemd`, `pm2` o Docker para que reinicie automáticamente.
