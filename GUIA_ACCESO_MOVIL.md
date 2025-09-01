# 🌐 Guía para Acceso Móvil - CGPlayerWeb

## 📱 Problema: ERR_CONNECTION_REFUSED desde otros PCs/móviles

### ✅ Solución Paso a Paso:

## 1. 🔥 Configurar Firewall de Windows

**Ejecutar PowerShell como ADMINISTRADOR** y ejecutar estos comandos:

```powershell
# Abrir puerto del Frontend (Vite)
netsh advfirewall firewall add rule name="CGPlayerWeb Frontend" dir=in action=allow protocol=TCP localport=5173

# Abrir puerto del Backend (Express)  
netsh advfirewall firewall add rule name="CGPlayerWeb Backend" dir=in action=allow protocol=TCP localport=3001
```

**O ejecutar el script automático:**
```powershell
# Clic derecho en abrir_puertos_firewall.ps1 → "Ejecutar con PowerShell" (como administrador)
```

## 2. 🌍 Verificar IP del PC servidor

La IP actual detectada es: **192.168.1.11**

Para verificar manualmente:
```cmd
ipconfig | findstr IPv4
```

## 3. 📱 URLs para acceso móvil

Una vez abiertos los puertos:

- **Frontend (App Web)**: `http://192.168.1.11:5173`
- **Backend (API)**: `http://192.168.1.11:3001/api`

## 4. 🔧 Verificar que los servicios estén ejecutándose

```bash
# Desde la carpeta del proyecto
npm run dev
```

Debe mostrar:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.11:5173/   ← Esta es la URL para móviles
```

## 5. 🧪 Probar conectividad

Desde otro PC en la misma red:
```bash
# Verificar conectividad
ping 192.168.1.11

# Verificar puertos abiertos
telnet 192.168.1.11 5173
telnet 192.168.1.11 3001
```

## 6. 📱 Acceso desde móvil

1. **Conectar el móvil a la misma WiFi**
2. **Abrir navegador** y ir a: `http://192.168.1.11:5173`
3. **Iniciar sesión** con las credenciales:

### 👥 Credenciales de prueba:
- **Admin**: `admin@chilegospel.com` / `admin123`
- **Director**: `director@chilegospel.com` / `director123`  
- **Cantantes**: `singer1@chilegospel.com` / `singer123` (hasta singer10)

## 🚨 Solución de problemas

### Si sigue dando ERR_CONNECTION_REFUSED:

1. **Verificar firewall**: ¿Están abiertos los puertos?
2. **Verificar antivirus**: Puede estar bloqueando conexiones
3. **Verificar router**: Algunos routers bloquean comunicación entre dispositivos
4. **Verificar que ambos dispositivos estén en la misma red WiFi**

### Para desactivar temporalmente el firewall (solo para pruebas):
```powershell
netsh advfirewall set allprofiles state off
# IMPORTANTE: Volver a activar después de la prueba
netsh advfirewall set allprofiles state on
```

## ✅ Configuración exitosa

Si todo funciona, deberías ver:
- ✅ La página de login carga desde el móvil
- ✅ Puedes iniciar sesión con las credenciales
- ✅ Las canciones se reproducen correctamente
- ✅ El reproductor funciona con controles nativos
