# Puesta en producción

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
- Backups de la carpeta `data/` y de los archivos subidos en `assets/`.
- Cambio obligatorio de contraseñas iniciales antes de publicar.
- Firewall habilitando solo `80`, `443` y SSH.

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
