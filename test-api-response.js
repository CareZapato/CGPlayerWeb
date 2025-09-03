// Test directo de la API para verificar isHighlighted
const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Test API directo (usando token de admin - reemplaza con uno válido)
    const response = await fetch('http://localhost:3001/api/lyrics/cmf48sdsc0005wpm65y04hkoc/sync', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWY0OGtuNnYwMDA2ZGh5cjk1MzRsNGtyIiwiZW1haWwiOiJhZG1pbkBjZ3BsYXllci5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3NTY5MjQyNzEsImV4cCI6MTc1NzUyOTA3MX0.zRFuNlWrepPn-Nyp6uoMpvUyKjNU6w3OKWAQgE67WNo',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('🔍 [API TEST] Respuesta del endpoint sync:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.get('content-type'));
    
    if (data.lyrics && data.lyrics.length > 0) {
      console.log('✅ [API TEST] Primera línea de letra:');
      console.log(JSON.stringify(data.lyrics[0], null, 2));
      
      console.log('🔍 [API TEST] Campos disponibles en primera línea:');
      console.log('- content:', !!data.lyrics[0].content);
      console.log('- startTime:', !!data.lyrics[0].startTime);
      console.log('- isHighlighted:', data.lyrics[0].isHighlighted);
      console.log('- lineNumber:', !!data.lyrics[0].lineNumber);
      
      if (data.lyrics[0].isHighlighted !== undefined) {
        console.log('✅ [SUCCESS] Campo isHighlighted PRESENTE!');
      } else {
        console.log('❌ [ERROR] Campo isHighlighted FALTANTE!');
      }
    } else {
      console.log('❌ [ERROR] No se encontraron letras');
    }
    
  } catch (error) {
    console.error('❌ [ERROR] Error en la prueba:', error);
  }
}

testAPI();
