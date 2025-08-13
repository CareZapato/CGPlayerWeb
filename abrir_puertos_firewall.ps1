# Script para abrir puertos del CGPlayerWeb en el firewall
# Ejecutar como Administrador

# Abrir puerto 5173 (Frontend Vite)
netsh advfirewall firewall add rule name="CGPlayerWeb Frontend" dir=in action=allow protocol=TCP localport=5173

# Abrir puerto 3001 (Backend Express)
netsh advfirewall firewall add rule name="CGPlayerWeb Backend" dir=in action=allow protocol=TCP localport=3001

Write-Host "Puertos abiertos en el firewall:"
Write-Host "- Puerto 5173 (Frontend)"
Write-Host "- Puerto 3001 (Backend)"
Write-Host ""
Write-Host "Ahora puedes acceder desde otros dispositivos:"
Write-Host "- Frontend: http://192.168.1.17:5173"
Write-Host "- Backend API: http://192.168.1.17:3001/api"

pause
