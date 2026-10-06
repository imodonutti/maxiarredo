#!/bin/sh
# Protezione con password per l'anteprima.
# Se in Coolify sono impostate BASIC_AUTH_USER e BASIC_AUTH_PASSWORD la attiva,
# altrimenti il sito resta aperto.
set -e
INC=/etc/nginx/auth.inc
if [ -n "$BASIC_AUTH_USER" ] && [ -n "$BASIC_AUTH_PASSWORD" ]; then
  printf '%s:%s\n' "$BASIC_AUTH_USER" "$(openssl passwd -apr1 "$BASIC_AUTH_PASSWORD")" > /etc/nginx/.htpasswd
  printf 'auth_basic "Maxiarredo - anteprima riservata";\nauth_basic_user_file /etc/nginx/.htpasswd;\n' > "$INC"
  echo "basic-auth: attiva per l'utente $BASIC_AUTH_USER"
else
  : > "$INC"
  echo "basic-auth: non impostata, sito aperto"
fi
