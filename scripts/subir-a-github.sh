#!/usr/bin/env bash
# Sube el proyecto a GitHub creando el repositorio automáticamente.
#
#   GITHUB_TOKEN=su_token ./scripts/subir-a-github.sh [nombre-del-repo] [private|public]
#
# El token se usa solo en memoria: no se escribe en disco ni queda en el
# historial de Git, y se borra de la configuración al terminar.

set -euo pipefail

REPO_NAME="${1:-salon-pamela-viury}"
VISIBILITY="${2:-private}"
TOKEN="${GITHUB_TOKEN:-}"

rojo()  { printf '\033[31m%s\033[0m\n' "$1"; }
verde() { printf '\033[32m%s\033[0m\n' "$1"; }
info()  { printf '\033[36m%s\033[0m\n' "$1"; }

if [ -z "$TOKEN" ]; then
  rojo "Falta el token. Ejecute:  GITHUB_TOKEN=su_token $0"
  exit 1
fi

api() { curl -sS --max-time 30 -H "Authorization: Bearer $TOKEN" \
        -H "Accept: application/vnd.github+json" "$@"; }

# 1. Comprobar el token y obtener el usuario -------------------------------
info "1/5  Verificando el token..."
USER_JSON="$(api https://api.github.com/user)"
USERNAME="$(printf '%s' "$USER_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("login",""))' 2>/dev/null || true)"

if [ -z "$USERNAME" ]; then
  rojo "El token no es válido o no tiene permisos."
  printf '%s\n' "$USER_JSON" | head -c 200
  exit 1
fi
verde "      Autenticado como: $USERNAME"

# 2. Comprobar que el token tiene permiso sobre repositorios ---------------
SCOPES="$(api -I https://api.github.com/user 2>/dev/null | tr -d '\r' \
          | grep -i '^x-oauth-scopes:' | cut -d' ' -f2- || true)"
[ -n "$SCOPES" ] && info "      Permisos del token: $SCOPES"

# 3. Crear el repositorio (o reutilizarlo si ya existe) --------------------
info "2/5  Creando el repositorio '$REPO_NAME' ($VISIBILITY)..."
PRIVATE=true; [ "$VISIBILITY" = "public" ] && PRIVATE=false

CREATE="$(api -X POST https://api.github.com/user/repos -d @- <<JSON
{"name":"$REPO_NAME",
 "private":$PRIVATE,
 "description":"Sitio web del Salón de Belleza Pamela Viury · Ciudad Juárez",
 "has_issues":true,"has_wiki":false}
JSON
)"

if printf '%s' "$CREATE" | grep -q '"full_name"'; then
  verde "      Repositorio creado."
elif printf '%s' "$CREATE" | grep -q 'already exists'; then
  info  "      Ya existía: se usará el repositorio actual."
else
  rojo "No se pudo crear el repositorio:"
  printf '%s\n' "$CREATE" | head -c 400
  exit 1
fi

# 4. Enviar el código ------------------------------------------------------
info "3/5  Enviando los archivos..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

# La credencial viaja en la URL solo durante este comando.
git push --quiet "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO_NAME.git" main:main
git branch --set-upstream-to=origin/main main >/dev/null 2>&1 || true

# 5. Verificar que llegó ---------------------------------------------------
info "4/5  Verificando..."
REMOTE_SHA="$(git ls-remote "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO_NAME.git" main | cut -f1)"
LOCAL_SHA="$(git rev-parse main)"

if [ "$REMOTE_SHA" = "$LOCAL_SHA" ]; then
  verde "      Confirmado: el contenido coincide."
else
  rojo "      La verificación no coincide. Revise el repositorio."
  exit 1
fi

# 6. Comprobar que no se subió ningún secreto ------------------------------
info "5/5  Comprobando que no se subió el archivo .env..."
if api "https://api.github.com/repos/$USERNAME/$REPO_NAME/contents/.env" | grep -q '"name"'; then
  rojo "      ATENCIÓN: el archivo .env está en el repositorio. Bórrelo de inmediato."
  exit 1
fi
verde "      Correcto: la contraseña no se subió."

printf '\n'
verde "LISTO · https://github.com/$USERNAME/$REPO_NAME"
printf '\n'
info "Recuerde revocar el token en:"
info "https://github.com/settings/tokens"
