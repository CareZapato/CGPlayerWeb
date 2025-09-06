// Test directo de reproducción de audio

// Obtener el token del localStorage (o usar uno fijo para pruebas)
const token = localStorage.getItem('token') || 'tu-token-aqui';

// URLs de prueba
const urls = [
  `http://192.168.1.10:3001/api/songs/file/church_medley_1757090115531/church_medley.mp3?token=${token}`,
  `http://192.168.1.10:3001/api/songs/file/dont_cry_1757090115548/dont_cry.mp3?token=${token}`
];

async function testAudioURLs() {
  console.log('🎵 === TEST DE URLS DE AUDIO ===');
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const fileName = url.match(/\/([^\/]+\.mp3)/)?.[1] || `audio-${i}`;
    
    console.log(`\n${i + 1}. Probando: ${fileName}`);
    console.log(`URL: ${url.substring(0, 100)}...`);
    
    try {
      // Test HTTP request
      const response = await fetch(url, {
        method: 'HEAD'  // Solo headers, no descargar el archivo
      });
      
      console.log(`   📡 HTTP Status: ${response.status}`);
      console.log(`   📝 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   📊 Content-Length: ${response.headers.get('content-length')}`);
      
      if (response.ok) {
        console.log(`   ✅ URL accesible`);
        
        // Test audio element
        const audio = new Audio();
        
        const testAudioElement = () => {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout'));
            }, 10000);
            
            audio.oncanplay = () => {
              clearTimeout(timeout);
              console.log(`   🎵 Audio element: CAN PLAY`);
              resolve('success');
            };
            
            audio.onerror = (error) => {
              clearTimeout(timeout);
              console.log(`   ❌ Audio element: ERROR`, error);
              reject(error);
            };
            
            audio.onloadstart = () => {
              console.log(`   🔄 Audio element: LOADING STARTED`);
            };
            
            audio.onloadeddata = () => {
              console.log(`   📊 Audio element: DATA LOADED`);
            };
            
            audio.src = url;
            audio.load();
          });
        };
        
        try {
          await testAudioElement();
          console.log(`   ✅ ${fileName} - COMPLETAMENTE FUNCIONAL`);
        } catch (audioError) {
          console.log(`   ❌ ${fileName} - FALLO EN AUDIO ELEMENT:`, audioError.message);
        }
        
      } else {
        console.log(`   ❌ URL no accesible: ${response.status} - ${response.statusText}`);
      }
      
    } catch (fetchError) {
      console.log(`   ❌ Error de fetch:`, fetchError.message);
    }
  }
  
  console.log('\n🏁 Test completado');
}

// Ejecutar el test
testAudioURLs().catch(console.error);
