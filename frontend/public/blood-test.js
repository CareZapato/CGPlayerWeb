// Test específico para el problema de letras reportado por el usuario
console.log('🩸 [BLOOD TEST] Test específico para letras de Blood...');

async function testBloodLyricsSpecific() {
  const token = localStorage.getItem('token');
  // Detectar la URL base automáticamente
  const currentHost = window.location.hostname;
  const API_BASE = currentHost === 'localhost' || currentHost === '127.0.0.1' 
    ? 'http://localhost:3001/api' 
    : `http://${currentHost}:3001/api`;
  
  if (!token) {
    console.error('❌ [BLOOD TEST] No hay token');
    return;
  }
  
  try {
    console.log('🔍 [BLOOD TEST] Buscando canción Blood...');
    
    // 1. Buscar canción Blood
    const response = await fetch(`${API_BASE}/songs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const bloodSong = data.songs.find(s => s.title.toLowerCase().includes('blood'));
    
    if (!bloodSong) {
      console.error('❌ [BLOOD TEST] No se encontró canción Blood');
      return;
    }
    
    console.log('✅ [BLOOD TEST] Canción Blood encontrada:', bloodSong.title, bloodSong.id);
    
    // 2. Obtener versiones de Blood
    const versionsResponse = await fetch(`${API_BASE}/songs/${bloodSong.id}/versions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const versionsData = await versionsResponse.json();
    console.log('🎵 [BLOOD TEST] Versiones de Blood:', versionsData.versions?.length || 0);
    
    if (!versionsData.versions || versionsData.versions.length === 0) {
      console.error('❌ [BLOOD TEST] No se encontraron versiones');
      return;
    }
    
    // 3. Probar letras de cada versión
    for (const version of versionsData.versions) {
      console.log(`🎤 [BLOOD TEST] Probando letras para ${version.voiceType} (ID: ${version.id})`);
      
      // Probar endpoint de letras completas
      const lyricsResponse = await fetch(`${API_BASE}/lyrics/${version.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (lyricsResponse.ok) {
        const lyricsData = await lyricsResponse.json();
        console.log(`📝 [BLOOD TEST] Letras completas ${version.voiceType}:`, {
          success: lyricsData.success,
          hasLyrics: !!lyricsData.song?.lyrics,
          lyricsCount: lyricsData.song?.lyrics?.length || 0,
          hasLyricsFiles: !!lyricsData.song?.lyricsFiles,
          lyricsFilesCount: lyricsData.song?.lyricsFiles?.length || 0
        });
      }
      
      // Probar endpoint de letras sincronizadas
      const syncResponse = await fetch(`${API_BASE}/lyrics/${version.id}/sync`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        console.log(`🎼 [BLOOD TEST] Letras sincronizadas ${version.voiceType}:`, {
          hasLyrics: !!syncData.lyrics,
          lyricsCount: syncData.lyrics?.length || 0,
          firstLyric: syncData.lyrics?.[0] ? {
            content: syncData.lyrics[0].content?.substring(0, 30) + '...',
            startTime: syncData.lyrics[0].startTime,
            isTextLyrics: syncData.lyrics[0].isTextLyrics,
            voiceType: syncData.lyrics[0].voiceType
          } : 'No hay letras'
        });
        
        if (syncData.lyrics && syncData.lyrics.length > 0) {
          // Analizar tipos de startTime
          const timeAnalysis = syncData.lyrics.reduce((acc, lyric) => {
            if (lyric.startTime === 0) acc.zeroTime++;
            else if (lyric.startTime > 0) acc.positiveTime++;
            else acc.nullOrUndefined++;
            return acc;
          }, { zeroTime: 0, positiveTime: 0, nullOrUndefined: 0 });
          
          console.log(`⏰ [BLOOD TEST] Análisis de tiempos ${version.voiceType}:`, timeAnalysis);
          
          // Mostrar primeras 3 letras como ejemplo
          console.log(`📋 [BLOOD TEST] Primeras 3 letras ${version.voiceType}:`);
          syncData.lyrics.slice(0, 3).forEach((lyric, i) => {
            console.log(`  ${i+1}. "${lyric.content?.substring(0, 40)}..." (startTime: ${lyric.startTime}, isText: ${lyric.isTextLyrics})`);
          });
        }
      } else {
        console.error(`❌ [BLOOD TEST] Error obteniendo letras sincronizadas ${version.voiceType}:`, syncResponse.status);
      }
    }
    
    console.log('✅ [BLOOD TEST] Test de Blood completado');
    
  } catch (error) {
    console.error('❌ [BLOOD TEST] Error:', error);
  }
}

// Función para verificar si las letras aparecen en el reproductor
function checkLyricsInPlayer() {
  console.log('🔍 [PLAYER CHECK] Verificando letras en reproductor...');
  
  // Buscar diferentes tipos de contenedores de letras
  const searches = [
    '[class*="lyrics"]',
    '[class*="sync"]', 
    '[class*="Lyrics"]',
    'div:contains("go to the rock")',
    'div:contains("Where do I go")'
  ];
  
  searches.forEach((selector, index) => {
    try {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 [PLAYER CHECK] Búsqueda ${index+1} (${selector}): ${elements.length} elementos`);
      
      elements.forEach((el, i) => {
        if (el.textContent && el.textContent.length > 0) {
          console.log(`  📝 [PLAYER CHECK] Elemento ${i+1}: ${el.textContent.substring(0, 50)}...`);
        }
      });
    } catch (error) {
      // Ignorar errores de selectores no válidos
    }
  });
  
  // Buscar texto específico de Blood
  const allElements = document.querySelectorAll('*');
  const bloodTexts = Array.from(allElements).filter(el => 
    el.textContent && (
      el.textContent.includes('go to the rock') ||
      el.textContent.includes('Where do I go') ||
      el.textContent.includes('When the Earth all around')
    )
  );
  
  console.log(`🩸 [PLAYER CHECK] Elementos con texto de Blood: ${bloodTexts.length}`);
  bloodTexts.forEach((el, i) => {
    console.log(`  🩸 [PLAYER CHECK] Blood ${i+1}: ${el.textContent.substring(0, 60)}...`);
  });
  
  return bloodTexts.length > 0;
}

// Exposer funciones
window.testBloodLyricsSpecific = testBloodLyricsSpecific;
window.checkLyricsInPlayer = checkLyricsInPlayer;

console.log('🩸 [BLOOD TEST] Funciones específicas cargadas:');
console.log('   - testBloodLyricsSpecific(): Test completo de letras de Blood');
console.log('   - checkLyricsInPlayer(): Verifica letras en reproductor actual');
console.log('💡 [BLOOD TEST] Ejecuta testBloodLyricsSpecific() primero');

// Auto-ejecutar si no estamos en álbumes
if (!window.location.pathname.includes('/albums')) {
  setTimeout(() => {
    console.log('🤖 [AUTO] Ejecutando test de Blood en 2 segundos...');
    testBloodLyricsSpecific();
  }, 2000);
}
