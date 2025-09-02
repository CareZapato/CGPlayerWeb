// Script de prueba para verificar letras
// Ejecutar en la consola del navegador después de reproducir una canción

async function testLyricsAPI() {
  console.log('🧪 [TEST LYRICS] Iniciando prueba de API de letras...');
  
  // Obtener token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ [TEST LYRICS] No hay token de autenticación');
    return;
  }
  
  // URLs base
  const API_BASE = 'http://192.168.1.11:3001/api';
  
  try {
    // 1. Obtener lista de canciones
    console.log('📋 [TEST LYRICS] Obteniendo lista de canciones...');
    const songsResponse = await fetch(`${API_BASE}/songs?includeVersions=false`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!songsResponse.ok) {
      throw new Error(`Error getting songs: ${songsResponse.status}`);
    }
    
    const songsData = await songsResponse.json();
    const songs = songsData.songs || [];
    console.log('📋 [TEST LYRICS] Canciones encontradas:', songs.length);
    
    if (songs.length === 0) {
      console.log('❌ [TEST LYRICS] No hay canciones para probar');
      return;
    }
    
    // 2. Probar con la primera canción que tenga variaciones
    let testSong = null;
    for (const song of songs.slice(0, 5)) { // Probar las primeras 5
      console.log(`🔍 [TEST LYRICS] Verificando canción: ${song.title} (ID: ${song.id})`);
      
      // Obtener versiones de esta canción
      const versionsResponse = await fetch(`${API_BASE}/songs/${song.id}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();
        console.log(`📋 [TEST LYRICS] Versiones para ${song.title}:`, versionsData.versions?.length || 0);
        
        if (versionsData.versions && versionsData.versions.length > 0) {
          testSong = versionsData.versions[0]; // Primera versión
          console.log(`✅ [TEST LYRICS] Usando versión: ${testSong.title} (${testSong.voiceType}) ID: ${testSong.id}`);
          break;
        }
      }
    }
    
    if (!testSong) {
      console.log('❌ [TEST LYRICS] No se encontró canción con versiones para probar');
      return;
    }
    
    // 3. Probar endpoints de letras
    console.log(`🎵 [TEST LYRICS] Probando endpoints de letras para: ${testSong.title}`);
    
    // Endpoint de información de letras
    console.log('📝 [TEST LYRICS] Probando GET /lyrics/:id');
    const lyricsResponse = await fetch(`${API_BASE}/lyrics/${testSong.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📝 [TEST LYRICS] Respuesta GET /lyrics/:id:', lyricsResponse.status);
    if (lyricsResponse.ok) {
      const lyricsData = await lyricsResponse.json();
      console.log('📝 [TEST LYRICS] Datos de letras:', lyricsData);
    } else {
      console.log('❌ [TEST LYRICS] Error en GET /lyrics/:id:', lyricsResponse.statusText);
    }
    
    // Endpoint de letras sincronizadas  
    console.log('🎼 [TEST LYRICS] Probando GET /lyrics/:id/sync');
    const syncResponse = await fetch(`${API_BASE}/lyrics/${testSong.id}/sync`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎼 [TEST LYRICS] Respuesta GET /lyrics/:id/sync:', syncResponse.status);
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('🎼 [TEST LYRICS] Letras sincronizadas:', syncData);
      
      if (Array.isArray(syncData.lyrics) && syncData.lyrics.length > 0) {
        console.log('✅ [TEST LYRICS] Letras encontradas:', syncData.lyrics.length);
        console.log('📝 [TEST LYRICS] Primera letra:', syncData.lyrics[0]);
        console.log('📝 [TEST LYRICS] Tipos de startTime:', syncData.lyrics.map(l => ({ 
          content: l.content?.substring(0, 30) + '...', 
          startTime: l.startTime, 
          isTextLyrics: l.isTextLyrics 
        })));
      } else {
        console.log('⚠️ [TEST LYRICS] No se encontraron letras sincronizadas');
      }
    } else {
      console.log('❌ [TEST LYRICS] Error en GET /lyrics/:id/sync:', syncResponse.statusText);
    }
    
    console.log('✅ [TEST LYRICS] Prueba completada');
    return testSong;
    
  } catch (error) {
    console.error('❌ [TEST LYRICS] Error en prueba:', error);
  }
}

// Función helper para probar reproducción
async function testSongPlayback() {
  console.log('🎵 [TEST PLAYBACK] Iniciando prueba de reproducción...');
  
  // Buscar SongCards en el DOM
  const songCards = document.querySelectorAll('.group');
  console.log('🎨 [TEST PLAYBACK] SongCards encontradas:', songCards.length);
  
  if (songCards.length > 0) {
    console.log('🎵 [TEST PLAYBACK] Simulando clic en primera canción...');
    
    // Buscar botón de play en la primera tarjeta
    const firstCard = songCards[0];
    
    // Hacer clic en la tarjeta para abrir el modal
    firstCard.click();
    
    // Esperar un poco y buscar botones de play
    setTimeout(() => {
      const playButtons = document.querySelectorAll('[onclick*="play"], [class*="play"]');
      console.log('▶️ [TEST PLAYBACK] Botones de play encontrados:', playButtons.length);
      
      if (playButtons.length > 0) {
        console.log('▶️ [TEST PLAYBACK] Haciendo clic en primer botón de play...');
        playButtons[0].click();
      }
    }, 1000);
  }
}

console.log('🧪 [SCRIPTS] Scripts de prueba cargados:');
console.log('   - testLyricsAPI(): Prueba endpoints de letras');
console.log('   - testSongPlayback(): Prueba reproducción de canciones');
console.log('💡 [SCRIPTS] Ejecuta testLyricsAPI() para verificar letras');
