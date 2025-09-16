# ✅ GARANTÍAS DE QUE LAS CARPETAS UPLOADS SIEMPRE EXISTAN EN EL VPS

## 🐳 EN EL DOCKERFILE (Línea 71):
```dockerfile
RUN mkdir -p /app/backend/uploads/songs /app/backend/uploads/events /app/backend/uploads/images/playlists /app/backend/uploads/images/profiles /app/logs /var/log/supervisor /etc/supervisor/conf.d
```

## 📁 ARCHIVOS .GITKEEP CREADOS:
- ✅ backend/uploads/songs/.gitkeep
- ✅ backend/uploads/events/.gitkeep  
- ✅ backend/uploads/images/playlists/.gitkeep
- ✅ backend/uploads/images/profiles/.gitkeep

## 🔒 PERMISOS CONFIGURADOS EN DOCKERFILE (Línea 133):
```dockerfile
RUN chown -R cgplayer:nodejs /app /var/log/supervisor && \
    chmod -R 755 /app/backend/uploads
```

## 📋 ESTRUCTURA GARANTIZADA EN EL CONTENEDOR:
```
/app/backend/uploads/
├── songs/           ← CREADA AUTOMÁTICAMENTE (vacía)
├── events/          ← CREADA AUTOMÁTICAMENTE (vacía)
├── images/
│   ├── playlists/   ← CREADA AUTOMÁTICAMENTE
│   └── profiles/    ← CREADA AUTOMÁTICAMENTE
└── README.md        ← SI EXISTE
```

## 🔄 VOLÚMENES EN DOCKER-COMPOSE.YML:
```yaml
volumes:
  - app_uploads:/app/backend/uploads
```

## ✅ VERIFICACIÓN POST-DEPLOY:
```bash
# Verificar que las carpetas existen en el contenedor:
docker exec cgplayer-app ls -la /app/backend/uploads/

# Debería mostrar:
# drwxr-xr-x  cgplayer nodejs  songs/
# drwxr-xr-x  cgplayer nodejs  events/  
# drwxr-xr-x  cgplayer nodejs  images/
```

## 🚨 COMANDOS DE EMERGENCIA SI NO EXISTEN:
```bash
# Crear manualmente si por alguna razón no existen:
docker exec cgplayer-app mkdir -p /app/backend/uploads/songs /app/backend/uploads/events
docker exec cgplayer-app chmod 755 /app/backend/uploads/songs /app/backend/uploads/events
docker exec cgplayer-app chown cgplayer:nodejs /app/backend/uploads/songs /app/backend/uploads/events
```

## 🎯 RESUMEN:
- Las carpetas se crean AUTOMÁTICAMENTE durante el build del contenedor
- Los archivos .gitkeep mantienen las carpetas en el repositorio  
- Los permisos correctos se asignan automáticamente
- El volumen persistente conserva los datos entre reinicios
- No requiere intervención manual
