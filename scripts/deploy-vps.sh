#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/principal}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TMP_BACKUP="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_BACKUP"
}

trap cleanup EXIT

copy_dir_if_exists() {
  local source_dir="$1"
  local target_dir="$2"

  if [ -d "$source_dir" ]; then
    mkdir -p "$target_dir"
    cp -a "$source_dir"/. "$target_dir"/
  fi
}

restore_dir_if_exists() {
  local source_dir="$1"
  local target_dir="$2"

  if [ -d "$source_dir" ]; then
    mkdir -p "$target_dir"
    cp -a "$source_dir"/. "$target_dir"/
  fi
}

echo "==> Deploy nuevawebmuni"
echo "APP_DIR=$APP_DIR"
echo "BRANCH=$BRANCH"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "ERROR: $APP_DIR no es un repositorio git"
  exit 1
fi

cd "$APP_DIR"

echo "==> Preservando datos runtime"
copy_dir_if_exists "data" "$TMP_BACKUP/data"
copy_dir_if_exists "public/uploads" "$TMP_BACKUP/public-uploads"

echo "==> Actualizando repositorio"
git fetch "$REMOTE"
git checkout "$BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"

echo "==> Restaurando datos runtime"
mkdir -p data public/uploads
restore_dir_if_exists "$TMP_BACKUP/data" "data"
restore_dir_if_exists "$TMP_BACKUP/public-uploads" "public/uploads"

echo "==> Ajustando permisos"
chown -R "$WEB_USER:$WEB_GROUP" "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;
chmod +x scripts/deploy-vps.sh

echo "==> Verificando Nginx"
nginx -t
systemctl reload "$NGINX_SERVICE"

echo "==> Deploy completado ($TIMESTAMP)"
