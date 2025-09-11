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

# Crear directorio de supervisord y configuración con inicialización integrada
RUN mkdir -p /etc/supervisor/conf.d && \
    echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'pidfile=/var/run/supervisord.pid' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'loglevel=info' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:init]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=/bin/sh -c "echo \"🚀 Iniciando CGPlayerWeb...\"; until pg_isready -h database -p 5432 -U cgplayer; do echo \"⏳ Esperando PostgreSQL...\"; sleep 2; done; echo \"✅ PostgreSQL listo!\"; cd /app/backend; npx prisma generate; npx prisma db push --accept-data-loss || true; node prisma/seed-definitivo.js || true; echo \"✅ Base de datos inicializada\"; echo \"🌐 Servicios iniciando...\""' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=false' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'startsecs=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=100' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:backend]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=node dist/index.js' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app/backend' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'user=cgplayer' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'environment=NODE_ENV=production,DATABASE_URL=%(ENV_DATABASE_URL)s,API_PORT=%(ENV_API_PORT)s' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=200' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=/usr/sbin/nginx -g "daemon off;"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'user=root' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=300' >> /etc/supervisor/conf.d/supervisord.conf

# Cambiar propietario de directorios
RUN chown -R cgplayer:nodejs /app /var/log/supervisor

# Crear directorio de logs
RUN mkdir -p /app/logs && chown -R cgplayer:nodejs /app/logs

# Exponer puertos
EXPOSE 80 3001

# Ejecutar supervisord directamente
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
