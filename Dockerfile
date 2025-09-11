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

# Instalar dependencias del frontend (incluye devDependencies para build)
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps

# Construir frontend para producción
RUN npm run build

# === STAGE 2: Build Backend ===
FROM base AS backend-builder

# Copiar archivos del backend
COPY backend/package*.json ./backend/
COPY backend/ ./backend/

# Instalar dependencias del backend (incluye devDependencies para build)
WORKDIR /app/backend
RUN npm ci --legacy-peer-deps

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

# Crear script de inicio integrado
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚀 Iniciando CGPlayerWeb v1.10.9..."' >> /app/start.sh && \
    echo 'until pg_isready -h database -p 5432 -U cgplayer; do' >> /app/start.sh && \
    echo '  echo "⏳ Esperando PostgreSQL..."' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "✅ PostgreSQL listo!"' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'npx prisma generate' >> /app/start.sh && \
    echo 'npx prisma db push --accept-data-loss || true' >> /app/start.sh && \
    echo 'node prisma/seed-definitivo.js || true' >> /app/start.sh && \
    echo 'echo "✅ Base de datos inicializada"' >> /app/start.sh && \
    echo 'echo "🌐 Iniciando servicios..."' >> /app/start.sh && \
    echo 'echo "Frontend: http://192.99.122.62"' >> /app/start.sh && \
    echo 'echo "Backend: http://192.99.122.62/api"' >> /app/start.sh && \
    echo 'echo "Usuario: admin@cgplayer.local / cgplayer2025"' >> /app/start.sh && \
    echo 'exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' >> /app/start.sh && \
    chmod +x /app/start.sh

# Cambiar propietario de directorios
RUN chown -R cgplayer:nodejs /app /var/log/supervisor

# Crear directorio de logs
RUN mkdir -p /app/logs && chown -R cgplayer:nodejs /app/logs

# Exponer puertos
EXPOSE 80 3001

# Ejecutar script de inicio
ENTRYPOINT ["/app/start.sh"]
