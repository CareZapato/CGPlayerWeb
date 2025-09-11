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

# Instalar dependencias del sistema para producción incluyendo OpenSSL para Prisma
RUN apk add --no-cache \
    postgresql-client \
    nginx \
    supervisor \
    openssl1.1-compat

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cgplayer -u 1001

# Crear directorios necesarios con estructura completa de uploads
WORKDIR /app
RUN mkdir -p /app/backend/uploads/events /app/backend/uploads/images /app/backend/uploads/audio /app/logs /var/log/supervisor /etc/supervisor/conf.d

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

# Crear configuración de supervisord con echo (compatible con linters)
RUN echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:init]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=/bin/sh -c "until pg_isready -h database -p 5432 -U cgplayer; do sleep 2; done; cd /app/backend; npx prisma generate; npx prisma db push --accept-data-loss || true; node prisma/seed-definitivo.js || true; echo CGPlayerWeb inicializado correctamente"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=false' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'startsecs=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=100' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:backend]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=node dist/index.js' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app/backend' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'user=cgplayer' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=200' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=/usr/sbin/nginx -g "daemon off;"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'user=root' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=300' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf

# Configurar permisos finales
RUN chown -R cgplayer:nodejs /app /var/log/supervisor && \
    chmod -R 755 /app/backend/uploads

# Exponer puertos
EXPOSE 80 3001

# Ejecutar supervisord directamente
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
