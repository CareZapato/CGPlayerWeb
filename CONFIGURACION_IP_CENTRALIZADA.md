# 📱 Configuración de IP Centralizada - CGPlayerWeb

## 🎯 Problema Solucionado

Antes tenías que cambiar la IP manualmente en múltiples archivos cada vez que cambiaba tu red. Ahora **solo necesitas cambiar la IP en un lugar** y todo se actualiza automáticamente.

## ⚡ Cambio Rápido de IP

### Método 1: Script Automático (Recomendado)
```bash
# Ejecutar el script de configuración
CONFIGURAR_IP.bat
```

### Método 2: Manual
1. **Edita** `frontend/.env` → Cambia `VITE_SERVER_IP=TU_NUEVA_IP`
2. **Ejecuta** `node scripts/update-ip-references.js`
3. **Reinicia** los servidores

## 📁 Sistema de Variables Centralizadas

### Frontend (.env)
```bash
# IP del servidor - CAMBIAR AQUÍ PARA ACTUALIZAR TODAS LAS REFERENCIAS
VITE_SERVER_IP=192.168.1.11

# Configuración automática
VITE_SERVER_HOST=192.168.1.11
VITE_SERVER_PORT=3001
VITE_FRONTEND_PORT=5173
VITE_API_BASE_URL=http://192.168.1.11:3001
VITE_FRONTEND_URL=http://192.168.1.11:5173
```

### Backend (.env)
```bash
# IP del servidor - sincronizada automáticamente
SERVER_IP=192.168.1.11

# URLs dinámicas
FRONTEND_URL=http://192.168.1.11:5173
CORS_ORIGINS=http://localhost:5173,http://192.168.1.11:5173
```

## 🔄 Archivos Actualizados Automáticamente

### ✅ Código Frontend:
- `src/pages/PlaylistsPage.tsx` - APIs dinámicas
- `src/hooks/useServerInfo.ts` - URLs dinámicas  
- `src/config/api.ts` - Configuración base

### ✅ Scripts PowerShell/Batch:
- `abrir_puertos_firewall.ps1` - Lee IP del config
- `ABRIR_PUERTOS.bat` - URLs actualizadas
- `CONFIGURAR_FIREWALL.bat` - Referencias actualizadas

### ✅ Documentación:
- `GUIA_ACCESO_MOVIL.md` - IPs actualizadas
- `SWAGGER_DOCS.md` - URLs de ejemplo
- `SOLUCION_COMPLETA.txt` - Referencias

## 🛠️ Scripts Disponibles

### `CONFIGURAR_IP.bat`
Configuración interactiva de IP con:
- Lectura de IP actual
- Cambio de IP guiado
- Actualización automática de archivos
- Configuración de firewall opcional

### `scripts/update-ip-references.js`
Script Node.js que actualiza automáticamente:
- Referencias en documentación
- Scripts de firewall  
- Archivos de configuración

### `scripts/start-with-ip.js`
Auto-detección y configuración de IP:
- Detecta IP de red automáticamente
- Sincroniza archivos .env
- Configura CORS dinámicamente

## 📱 URLs Generadas Automáticamente

Con IP `192.168.1.11`:

```bash
# Desarrollo Local
Frontend: http://localhost:5173
Backend: http://localhost:3001
API: http://localhost:3001/api

# Acceso desde Red/Móvil  
Frontend: http://192.168.1.11:5173
Backend: http://192.168.1.11:3001
API: http://192.168.1.11:3001/api
Documentación: http://192.168.1.11:3001/api-docs
```

## 🔧 Detección Automática

### Frontend
- Usa `import.meta.env.VITE_API_BASE_URL` en lugar de URLs hardcodeadas
- Fallback automático a localhost si no hay variables

### Backend
- CORS configurado dinámicamente
- Auto-detección de IP local
- Soporte para múltiples orígenes

## 📋 Checklist de Migración

✅ **Frontend .env** - IP centralizada  
✅ **Backend .env** - Variables sincronizadas  
✅ **Código React** - APIs dinámicas  
✅ **Scripts PowerShell** - IP desde config  
✅ **Documentación** - Referencias actualizadas  
✅ **Detección automática** - IP de red  

## 🚀 Iniciar Servidores

```bash
# Método 1: Juntos
npm run dev

# Método 2: Separados  
cd backend && npm run dev
cd frontend && npm run dev

# Método 3: Con auto-detección de IP
node scripts/start-with-ip.js && npm run dev
```

## 🆘 Solución de Problemas

### IP No Se Actualiza
1. Verifica que `VITE_SERVER_IP` esté en `frontend/.env`
2. Ejecuta `node scripts/update-ip-references.js`
3. Reinicia servidores con `npm run dev`

### Error CORS desde Móvil
1. Verifica firewall con `CONFIGURAR_FIREWALL.bat`
2. Confirma que `CORS_ORIGINS` incluya tu IP
3. Reinicia backend

### Frontend No Encuentra Backend
1. Verifica que `VITE_API_BASE_URL` sea correcta
2. Confirma que backend esté corriendo en la IP/puerto correctos
3. Prueba acceso directo: `http://TU_IP:3001/api/health`

## 💡 Ejemplos de Uso

### Cambiar IP de 192.168.1.11 a 192.168.1.50:

```bash
# 1. Método automático
CONFIGURAR_IP.bat
# Seguir prompts interactivos

# 2. Método manual
# Editar frontend/.env:
VITE_SERVER_IP=192.168.1.50

# Ejecutar actualización:
node scripts/update-ip-references.js

# Reiniciar:
npm run dev
```

### Verificar Configuración:
```bash
# Ver IP configurada:
type frontend\.env | findstr VITE_SERVER_IP

# Ver archivos actualizados:
type ip-config.env

# Probar conectividad:
curl http://TU_IP:3001/api/health
```

## 🎉 Beneficios

✅ **Un solo punto de configuración** - Cambias IP en un lugar  
✅ **Actualizaciones automáticas** - Scripts sincronizan todo  
✅ **Sin errores de inconsistencia** - IP única en todo el proyecto  
✅ **Fácil para el equipo** - Instrucciones claras  
✅ **Soporte móvil completo** - URLs dinámicas  
✅ **Detección automática** - IP de red local  

¡Ahora cambiar de red es tan fácil como editar una línea! 🚀
