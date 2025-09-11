# Dockerfile principal para CGPlayerWeb
# Este Dockerfile construye tanto frontend como backend en un solo contenedor

FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración raíz
COPY package*.json ./

# === STAGE 1: Build Frontend ===
FROM base AS frontend-builder

# Copiar archivos del frontend
COPY frontend/package*.json ./frontend/
COPY frontend/ ./frontend/

# Instalar dependencias del frontend
WORKDIR /app/frontend
RUN npm ci --only=production

# Construir frontend para producción
RUN npm run build

# === STAGE 2: Build Backend ===
FROM base AS backend-builder

# Copiar archivos del backend
COPY backend/package*.json ./backend/
COPY backend/ ./backend/

# Instalar dependencias del backend
WORKDIR /app/backend
RUN npm ci --only=production

# Generar cliente Prisma
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# === STAGE 3: Production ===
FROM node:18-alpine AS production

# Instalar dependencias del sistema para producción
RUN apk add --no-cache \
    postgresql-client \
    nginx \
    supervisor

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cgplayer -u 1001

# Crear directorios necesarios
WORKDIR /app
RUN mkdir -p /app/backend/uploads /app/logs /var/log/supervisor

# Copiar configuración raíz primero para instalar dependencias
COPY --chown=cgplayer:nodejs package*.json ./
RUN npm ci --only=production

# Copiar backend compilado
COPY --from=backend-builder --chown=cgplayer:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=cgplayer:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=cgplayer:nodejs /app/backend/package*.json ./backend/
COPY --from=backend-builder --chown=cgplayer:nodejs /app/backend/prisma ./backend/prisma

# El seed ya está incluido en backend/prisma copiado desde backend-builder

# Copiar frontend construido
COPY --from=frontend-builder --chown=cgplayer:nodejs /app/frontend/dist ./frontend/dist

# Copiar archivos de configuración
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /app/start.sh

# Hacer ejecutable el script de inicio
RUN chmod +x /app/start.sh

# Cambiar propietario de directorios
RUN chown -R cgplayer:nodejs /app /var/log/supervisor

# Exponer puertos
EXPOSE 80 3001

# Cambiar a usuario no-root
USER cgplayer

# Comando de inicio
CMD ["/app/start.sh"]
