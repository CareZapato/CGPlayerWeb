# Script de PowerShell para probar el API
$baseUrl = "http://localhost:3001/api"

Write-Host "🧪 Iniciando prueba de letras específicas por tipo de voz..." -ForegroundColor Cyan

# Login
Write-Host "🔐 Haciendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@cgplayer.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login exitoso" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Crear canción con variantes
Write-Host "🎵 Creando canción con variantes..." -ForegroundColor Yellow
$songBody = @{
    title = "Test Voice Specific Lyrics"
    originalKey = "C"
    currentKey = "C"  
    tempo = 120
    timeSignature = "4/4"
    locationId = "cm08g1tc00001k2bwyg0tq1g6"
    voiceTypes = @("SOPRANO", "CONTRALTO")
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $songResponse = Invoke-RestMethod -Uri "$baseUrl/songs" -Method POST -Body $songBody -Headers $headers
    Write-Host "✅ Canción creada: $($songResponse.title)" -ForegroundColor Green
    Write-Host "🎭 Variantes creadas: $($songResponse.variants.Count)" -ForegroundColor Blue
    
    foreach ($variant in $songResponse.variants) {
        Write-Host "   - $($variant.voiceType): $($variant.id)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error creando canción: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Usar cualquier songId para probar el endpoint
$testSongId = $songResponse.variants[0].id
Write-Host "🎯 Usando songId para pruebas: $testSongId" -ForegroundColor Blue

# Guardar letras para SOPRANO
Write-Host "`n📝 Guardando letras para SOPRANO..." -ForegroundColor Yellow
$sopranoLyrics = @{
    content = @"
Letras específicas para SOPRANO
Notas agudas y melodías altas  
Parte exclusiva para soprano
Línea 4 de soprano
"@
    voiceType = "SOPRANO"
    isTextOnly = $true
} | ConvertTo-Json

try {
    $sopranoResponse = Invoke-RestMethod -Uri "$baseUrl/lyrics/$testSongId/text" -Method PUT -Body $sopranoLyrics -Headers $headers
    Write-Host "✅ Letras SOPRANO guardadas exitosamente" -ForegroundColor Green
    Write-Host "   🎯 Guardado en songId: $($sopranoResponse.lyric.songId)" -ForegroundColor Blue
    Write-Host "   🎭 VoiceType: $($sopranoResponse.lyric.voiceType)" -ForegroundColor Blue
} catch {
    Write-Host "❌ Error guardando SOPRANO: $($_.Exception.Message)" -ForegroundColor Red
}

# Guardar letras para CONTRALTO  
Write-Host "`n📝 Guardando letras para CONTRALTO..." -ForegroundColor Yellow
$contraltoLyrics = @{
    content = @"
Letras específicas para CONTRALTO
Notas medias y armonías ricas
Parte exclusiva para contralto  
Línea 4 de contralto
"@
    voiceType = "CONTRALTO"
    isTextOnly = $true
} | ConvertTo-Json

try {
    $contraltoResponse = Invoke-RestMethod -Uri "$baseUrl/lyrics/$testSongId/text" -Method PUT -Body $contraltoLyrics -Headers $headers
    Write-Host "✅ Letras CONTRALTO guardadas exitosamente" -ForegroundColor Green
    Write-Host "   🎯 Guardado en songId: $($contraltoResponse.lyric.songId)" -ForegroundColor Blue
    Write-Host "   🎭 VoiceType: $($contraltoResponse.lyric.voiceType)" -ForegroundColor Blue
} catch {
    Write-Host "❌ Error guardando CONTRALTO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Prueba completada!" -ForegroundColor Green
Write-Host "📊 Ahora revisa la base de datos para verificar que las letras se guardaron en los songIds correctos" -ForegroundColor Cyan
