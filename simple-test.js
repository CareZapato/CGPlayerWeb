const https = require('https');
const http = require('http');

// Simple HTTP request function
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('🧪 Iniciando prueba simple...');
  
  // Login
  console.log('🔐 Haciendo login...');
  const loginResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, {
    email: 'admin@cgplayer.com',
    password: 'admin123'
  });
  
  if (loginResult.status !== 200) {
    console.error('❌ Error en login:', loginResult);
    return;
  }
  
  const token = loginResult.data.token;
  console.log('✅ Login exitoso');
  
  // Crear canción
  console.log('🎵 Creando canción...');
  const songResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/songs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    title: 'Test Voice Lyrics',
    originalKey: 'C',
    currentKey: 'C',
    tempo: 120,
    timeSignature: '4/4',
    locationId: 'cm08g1tc00001k2bwyg0tq1g6',
    voiceTypes: ['SOPRANO', 'CONTRALTO']
  });
  
  if (songResult.status !== 201) {
    console.error('❌ Error creando canción:', songResult);
    return;
  }
  
  console.log('✅ Canción creada:', songResult.data.title);
  console.log('🎭 Variantes creadas:', songResult.data.variants?.length || 0);
  
  if (songResult.data.variants) {
    songResult.data.variants.forEach(v => {
      console.log(`   - ${v.voiceType}: ${v.id}`);
    });
  }
  
  // Usar cualquier songId para guardar letras específicas
  const testSongId = songResult.data.variants?.[0]?.id || songResult.data.id;
  
  // Guardar letras para SOPRANO
  console.log('\n📝 Guardando letras para SOPRANO...');
  const sopranoResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/lyrics/${testSongId}/text`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    content: 'Letras específicas para SOPRANO\nNotas agudas y melodías altas\nParte exclusiva para soprano',
    voiceType: 'SOPRANO',
    isTextOnly: true
  });
  
  console.log('📊 Resultado SOPRANO:', sopranoResult.status === 200 ? '✅ Éxito' : '❌ Error');
  if (sopranoResult.data.lyric) {
    console.log(`   🎯 Guardado en songId: ${sopranoResult.data.lyric.songId}`);
    console.log(`   🎭 VoiceType: ${sopranoResult.data.lyric.voiceType}`);
  }
  
  // Guardar letras para CONTRALTO
  console.log('\n📝 Guardando letras para CONTRALTO...');
  const contraltoResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/lyrics/${testSongId}/text`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    content: 'Letras específicas para CONTRALTO\nNotas medias y armonías ricas\nParte exclusiva para contralto',
    voiceType: 'CONTRALTO',
    isTextOnly: true
  });
  
  console.log('📊 Resultado CONTRALTO:', contraltoResult.status === 200 ? '✅ Éxito' : '❌ Error');
  if (contraltoResult.data.lyric) {
    console.log(`   🎯 Guardado en songId: ${contraltoResult.data.lyric.songId}`);
    console.log(`   🎭 VoiceType: ${contraltoResult.data.lyric.voiceType}`);
  }
  
  console.log('\n✅ Prueba completada!');
}

test().catch(console.error);
