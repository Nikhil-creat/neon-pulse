FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
