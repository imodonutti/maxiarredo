# Maxiarredo — anteprima statica della bozza (fase prototipo).
# Più avanti questo repo ospiterà il tema WordPress, come gli altri siti DinamoAI.
FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/40-basic-auth.sh /docker-entrypoint.d/40-basic-auth.sh
RUN chmod +x /docker-entrypoint.d/40-basic-auth.sh

COPY prototipo/ /usr/share/nginx/html/

EXPOSE 80
