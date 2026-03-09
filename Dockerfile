# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /usr/src/app

# Aprovechar caché de capas
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:24-alpine
WORKDIR /usr/src/app

# Definir entorno de producción
ENV NODE_ENV=production

COPY package*.json ./
# Instalación limpia de solo dependencias de ejecución
RUN npm install --omit=dev

# Copiar el código compilado desde el builder
COPY --from=builder /usr/src/app/dist ./dist

# EXPOSE es informativo, el mapeo real lo hace docker-compose
EXPOSE 5000

# Usar el archivo compilado por NestJS
CMD ["node", "dist/main"]