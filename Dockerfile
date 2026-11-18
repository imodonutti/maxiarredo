# Maxiarredo — sito statico servito da nginx su Coolify.

# 1. Generazione: pagine dei progetti, sitemap e llms.txt da assets/data/progetti.json
FROM node:22-alpine AS genera
WORKDIR /src
COPY prototipo/ prototipo/
COPY strumenti/ strumenti/
RUN node strumenti/genera.js

# 2. Pubblicazione
FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/sicurezza.conf /etc/nginx/snippets/sicurezza.conf
COPY nginx/40-basic-auth.sh /docker-entrypoint.d/40-basic-auth.sh
RUN chmod +x /docker-entrypoint.d/40-basic-auth.sh

COPY --from=genera /src/prototipo/ /usr/share/nginx/html/

EXPOSE 80
