# Limpieza de Archivos de Desarrollo y Test

Write-Host "Iniciando limpieza de archivos innecesarios..." -ForegroundColor Green

# Limpiar archivos de test en la raíz
$testFiles = Get-ChildItem -Path "." -Name "*test*.js", "*test*.html", "*simple*.js"
Write-Host "Encontrados $($testFiles.Count) archivos de test en la raíz"

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Eliminado: $file" -ForegroundColor Yellow
    }
}

# Limpiar archivos check duplicados
$checkFiles = @(
    "check-songs.js",
    "check-lyrics.js"
)

foreach ($file in $checkFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Eliminado: $file" -ForegroundColor Yellow
    }
}

# Limpiar archivos de desarrollo backend duplicados
$backendCleanupFiles = @(
    "backend\debug-latest-upload.js",
    "backend\checkDB.js"
)

foreach ($file in $backendCleanupFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Eliminado: $file" -ForegroundColor Yellow
    }
}

# Limpiar archivos HTML de test
$htmlTestFiles = Get-ChildItem -Path "." -Name "*test*.html", "*execute*.html"
Write-Host "Encontrados $($htmlTestFiles.Count) archivos HTML de test"

foreach ($file in $htmlTestFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Eliminado: $file" -ForegroundColor Yellow
    }
}

# Limpiar archivos de configuración duplicados
$configFiles = @(
    "ABRIR_PUERTOS.bat",
    "CONFIGURAR_FIREWALL.bat", 
    "CONFIGURAR_IP.bat"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "Mantenido (puede ser útil): $file" -ForegroundColor Blue
    }
}

Write-Host "`nLimpieza completada!" -ForegroundColor Green
Write-Host "Archivos principales del proyecto mantenidos" -ForegroundColor Cyan
