FROM nginxinc/nginx-unprivileged:alpine
COPY docs/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1
