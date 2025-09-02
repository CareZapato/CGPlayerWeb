$songId = "cmf2ok5qe00019y3o71n7pza1"
$voiceType = "SOPRANO"
$url = "http://localhost:3001/api/lyrics/$songId/text"

$body = @{
    text = "0:05 Test lyric for SOPRANO`n0:10 Second line for SOPRANO"
    voiceType = $voiceType
} | ConvertTo-Json

Write-Host "🧪 Testing lyrics save for $voiceType..."
Write-Host "📝 URL: $url"
Write-Host "📄 Body: $body"

try {
    $response = Invoke-RestMethod -Uri $url -Method PUT -Body $body -ContentType "application/json"
    Write-Host "✅ Success!"
    Write-Host "📊 Response:" ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "🔍 Response: $($_.Exception.Response)"
}
