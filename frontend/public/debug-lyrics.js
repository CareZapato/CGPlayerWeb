// Test script para verificar problemas específicos de letras
// Ejecutar en consola del navegador después de cargar una canción con letras

window.debugLyrics = function() {
  console.log('🐛 [DEBUG LYRICS] Iniciando debug de letras...');
  
  // Verificar si hay un reproductor activo
  const playerStore = window.playerStore || window.zustand?.playerStore;
  if (playerStore) {
    console.log('🎵 [DEBUG] Player store encontrado');
  }
  
  // Buscar componente de letras en el DOM
  const lyricsElements = document.querySelectorAll('[class*="lyrics"], [class*="sync"]');
  console.log('📝 [DEBUG] Elementos de letras en DOM:', lyricsElements.length);
  
  lyricsElements.forEach((element, index) => {
    console.log(`📝 [DEBUG] Elemento ${index}:`, {
      classes: element.className,
      textContent: element.textContent?.substring(0, 100) + '...',
      children: element.children.length
    });
  });
  
  // Verificar si hay mensajes de "No hay letras"
  const noLyricsMessages = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent?.includes('No hay letras') || 
    el.textContent?.includes('letras disponibles')
  );
  
  console.log('❌ [DEBUG] Mensajes de "No hay letras":', noLyricsMessages.length);
  noLyricsMessages.forEach((msg, index) => {
    console.log(`❌ [DEBUG] Mensaje ${index}:`, msg.textContent);
  });
  
  // Verificar filtros de voz
  const voiceFilters = document.querySelectorAll('[class*="voice"], [class*="Voice"]');
  console.log('🎤 [DEBUG] Filtros de voz encontrados:', voiceFilters.length);
  
  // Verificar estados de loading
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
  console.log('⏳ [DEBUG] Elementos de loading:', loadingElements.length);
  
  return {
    lyricsElements: lyricsElements.length,
    noLyricsMessages: noLyricsMessages.length,
    voiceFilters: voiceFilters.length,
    loadingElements: loadingElements.length
  };
};

window.testBloodSong = async function() {
  console.log('🩸 [TEST BLOOD] Probando canción Blood específicamente...');
  
  const token = localStorage.getItem('token');
  // Detectar la URL base automáticamente
  const currentHost = window.location.hostname;
  const API_BASE = currentHost === 'localhost' || currentHost === '127.0.0.1' 
    ? 'http://localhost:3001/api' 
    : `http://${currentHost}:3001/api`;
  
  try {
    // Buscar canción Blood
    const songsResponse = await fetch(`${API_BASE}/songs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const songsData = await songsResponse.json();
    const bloodSongs = songsData.songs.filter(s => s.title.toLowerCase().includes('blood'));
    
    console.log('🩸 [TEST BLOOD] Canciones Blood encontradas:', bloodSongs.length);
    
    if (bloodSongs.length > 0) {
      const bloodSong = bloodSongs[0];
      console.log('🩸 [TEST BLOOD] Probando con:', bloodSong.title, bloodSong.id);
      
      // Obtener versiones
      const versionsResponse = await fetch(`${API_BASE}/songs/${bloodSong.id}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const versionsData = await versionsResponse.json();
      console.log('🩸 [TEST BLOOD] Versiones:', versionsData.versions?.length || 0);
      
      if (versionsData.versions && versionsData.versions.length > 0) {
        const firstVersion = versionsData.versions[0];
        console.log('🩸 [TEST BLOOD] Primera versión:', firstVersion.title, firstVersion.voiceType, firstVersion.id);
        
        // Probar letras de esta versión
        const lyricsResponse = await fetch(`${API_BASE}/lyrics/${firstVersion.id}/sync`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (lyricsResponse.ok) {
          const lyricsData = await lyricsResponse.json();
          console.log('🩸 [TEST BLOOD] Letras encontradas:', lyricsData.lyrics?.length || 0);
          
          if (lyricsData.lyrics && lyricsData.lyrics.length > 0) {
            console.log('✅ [TEST BLOOD] Letras OK, primera letra:', lyricsData.lyrics[0]);
            console.log('🕐 [TEST BLOOD] StartTimes:', lyricsData.lyrics.slice(0, 5).map(l => ({
              content: l.content.substring(0, 20) + '...',
              startTime: l.startTime,
              isTextLyrics: l.isTextLyrics
            })));
          }
        } else {
          console.log('❌ [TEST BLOOD] Error obteniendo letras:', lyricsResponse.status);
        }
      }
    }
  } catch (error) {
    console.error('❌ [TEST BLOOD] Error:', error);
  }
};

console.log('🐛 [DEBUG SCRIPTS] Scripts de debug cargados:');
console.log('   - debugLyrics(): Analiza elementos de letras en DOM');
console.log('   - testBloodSong(): Prueba específicamente la canción Blood');
console.log('💡 [DEBUG] Reproduce una canción y ejecuta debugLyrics()');
