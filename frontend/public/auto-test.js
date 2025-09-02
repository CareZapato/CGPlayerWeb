// Test automatico para verificar los arreglos
console.log('🚀 [AUTO TEST] Iniciando test automático...');

// Función para esperar un tiempo
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para simular clic en elemento
const clickElement = (element) => {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.click();
    console.log('👆 [CLICK] Elemento clickeado:', element.className);
    return true;
  }
  return false;
};

async function testSongPlayback() {
  console.log('🎵 [TEST] === PROBANDO REPRODUCCIÓN DESDE ÁLBUMES ===');
  
  try {
    // 1. Navegar a álbumes si no estamos ahí
    if (!window.location.pathname.includes('/albums')) {
      console.log('📍 [TEST] Navegando a /albums...');
      window.location.href = '/albums';
      await wait(2000);
    }
    
    console.log('📍 [TEST] En página:', window.location.pathname);
    
    // 2. Buscar tarjetas de canciones
    await wait(1000);
    const songCards = document.querySelectorAll('.group');
    console.log(`🎨 [TEST] SongCards encontradas: ${songCards.length}`);
    
    if (songCards.length === 0) {
      console.log('❌ [TEST] No se encontraron canciones en álbumes');
      return;
    }
    
    // 3. Hacer clic en la primera canción para abrir modal
    console.log('🎨 [TEST] Haciendo clic en primera canción...');
    const firstCard = songCards[0];
    clickElement(firstCard);
    
    await wait(1500);
    
    // 4. Buscar botones de reproducción en el modal
    const modalPlayButtons = document.querySelectorAll('button[class*="bg-primary"], button[class*="bg-blue"]');
    console.log(`▶️ [TEST] Botones de play en modal: ${modalPlayButtons.length}`);
    
    if (modalPlayButtons.length > 0) {
      console.log('▶️ [TEST] Haciendo clic en botón de play...');
      const playButton = Array.from(modalPlayButtons).find(btn => 
        btn.textContent?.includes('Reproducir') || 
        btn.textContent?.includes('Play') ||
        btn.innerHTML?.includes('play')
      );
      
      if (playButton) {
        clickElement(playButton);
        console.log('✅ [TEST] Botón de play clickeado');
        
        // 5. Verificar que se inició la reproducción
        await wait(2000);
        
        const audioElements = document.querySelectorAll('audio');
        console.log(`🔊 [TEST] Elementos de audio encontrados: ${audioElements.length}`);
        
        audioElements.forEach((audio, index) => {
          console.log(`🔊 [TEST] Audio ${index}:`, {
            src: audio.src?.substring(0, 50) + '...',
            currentTime: audio.currentTime,
            duration: audio.duration,
            paused: audio.paused,
            readyState: audio.readyState
          });
        });
        
        // 6. Verificar si aparecen letras
        await wait(1000);
        const lyricsElements = document.querySelectorAll('[class*="lyrics"], [class*="sync"]');
        console.log(`📝 [TEST] Elementos de letras después de reproducir: ${lyricsElements.length}`);
        
        return true;
      }
    }
    
    // Método alternativo: buscar menú de contexto
    console.log('🔍 [TEST] Buscando menú de contexto...');
    const menuButtons = document.querySelectorAll('button[class*="menu"]');
    console.log(`📋 [TEST] Botones de menú encontrados: ${menuButtons.length}`);
    
    if (menuButtons.length > 0) {
      clickElement(menuButtons[0]);
      await wait(500);
      
      const menuOptions = document.querySelectorAll('[class*="menu"] button');
      const playOption = Array.from(menuOptions).find(btn => 
        btn.textContent?.includes('Reproducir') || btn.textContent?.includes('Play')
      );
      
      if (playOption) {
        clickElement(playOption);
        console.log('✅ [TEST] Opción de reproducir clickeada desde menú');
        return true;
      }
    }
    
    console.log('❌ [TEST] No se pudo encontrar forma de reproducir');
    return false;
    
  } catch (error) {
    console.error('❌ [TEST] Error en test de reproducción:', error);
    return false;
  }
}

async function testLyricsDisplay() {
  console.log('📝 [TEST] === PROBANDO VISUALIZACIÓN DE LETRAS ===');
  
  try {
    // Esperar un poco para que se carguen las letras
    await wait(2000);
    
    // Verificar si hay un reproductor activo
    const playerElements = document.querySelectorAll('[class*="player"], [class*="Player"]');
    console.log(`🎵 [TEST] Elementos de reproductor: ${playerElements.length}`);
    
    // Buscar sección de letras específicamente
    const lyricsContainers = document.querySelectorAll('[class*="lyrics"], [class*="sync"]');
    console.log(`📝 [TEST] Contenedores de letras: ${lyricsContainers.length}`);
    
    lyricsContainers.forEach((container, index) => {
      console.log(`📝 [TEST] Contenedor ${index}:`, {
        className: container.className,
        textContent: container.textContent?.substring(0, 100) + '...',
        children: container.children.length,
        visible: container.offsetHeight > 0 && container.offsetWidth > 0
      });
    });
    
    // Buscar mensajes de "No hay letras"
    const noLyricsMessages = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent?.includes('No hay letras') || 
      el.textContent?.includes('letras disponibles') ||
      el.textContent?.includes('No lyrics')
    );
    
    console.log(`❌ [TEST] Mensajes de "No hay letras": ${noLyricsMessages.length}`);
    noLyricsMessages.forEach(msg => {
      console.log(`❌ [TEST] Mensaje:`, msg.textContent);
    });
    
    // Buscar letras específicas de Blood
    const bloodLyrics = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent?.includes('go to the rock') || 
      el.textContent?.includes('Where do I go') ||
      el.textContent?.includes('When the Earth all around')
    );
    
    console.log(`🩸 [TEST] Letras de Blood encontradas: ${bloodLyrics.length}`);
    bloodLyrics.forEach((lyric, index) => {
      console.log(`🩸 [TEST] Letra ${index}:`, lyric.textContent?.substring(0, 50) + '...');
    });
    
    return bloodLyrics.length > 0 || lyricsContainers.length > 0;
    
  } catch (error) {
    console.error('❌ [TEST] Error en test de letras:', error);
    return false;
  }
}

// Ejecutar ambos tests
async function runFullTest() {
  console.log('🚀 [FULL TEST] Iniciando test completo...');
  
  const playbackResult = await testSongPlayback();
  console.log(`🎵 [FULL TEST] Reproducción: ${playbackResult ? '✅ OK' : '❌ FALLO'}`);
  
  const lyricsResult = await testLyricsDisplay();
  console.log(`📝 [FULL TEST] Letras: ${lyricsResult ? '✅ OK' : '❌ FALLO'}`);
  
  console.log('🏁 [FULL TEST] Test completado');
  console.log(`📊 [FULL TEST] Resultado final: ${playbackResult && lyricsResult ? '✅ TODO OK' : '⚠️ HAY PROBLEMAS'}`);
  
  return { playback: playbackResult, lyrics: lyricsResult };
}

// Exponer funciones globalmente
window.testSongPlayback = testSongPlayback;
window.testLyricsDisplay = testLyricsDisplay;
window.runFullTest = runFullTest;

console.log('🧪 [AUTO TEST] Tests disponibles:');
console.log('   - testSongPlayback(): Prueba reproducción desde álbumes');
console.log('   - testLyricsDisplay(): Prueba visualización de letras');
console.log('   - runFullTest(): Ejecuta ambos tests');
console.log('💡 [AUTO TEST] Ejecuta runFullTest() para probar todo');

// Auto-ejecutar después de 3 segundos si estamos en álbumes
if (window.location.pathname.includes('/albums')) {
  setTimeout(() => {
    console.log('🤖 [AUTO] Ejecutando test automático en 3 segundos...');
    runFullTest();
  }, 3000);
}
