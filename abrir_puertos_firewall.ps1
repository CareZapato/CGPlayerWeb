# Script para abrir puertos del CGPlayerWeb en el firewall
# Ejecutar como Administrador

# Leer IP desde archivo de configuración
$configPath = Join-Path $PSScriptRoot "ip-config.env"
$serverIP = "192.168.1.11"  # IP por defecto

if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match "SERVER_IP=(.+)") {
        $serverIP = $matches[1].Trim()
    }
}

# Abrir puerto 5173 (Frontend Vite)
netsh advfirewall firewall add rule name="CGPlayerWeb Frontend" dir=in action=allow protocol=TCP localport=5173

# Abrir puerto 3001 (Backend Express)
netsh advfirewall firewall add rule name="CGPlayerWeb Backend" dir=in action=allow protocol=TCP localport=3001

Write-Host "Puertos abiertos en el firewall:"
Write-Host "- Puerto 5173 (Frontend)"
Write-Host "- Puerto 3001 (Backend)"
Write-Host ""
Write-Host "Ahora puedes acceder desde otros dispositivos:"
Write-Host "- Frontend: http://$serverIP:5173"
Write-Host "- Backend API: http://$serverIP:3001/api"

pause
