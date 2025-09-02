// Test específico usando las canciones reales que ya existen
const https = require('https');
const http = require('http');

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

async function testRealSongs() {
  console.log('🧪 Probando con canciones reales existentes...\n');
  
  try {
    // Login
    const loginResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@cgplayer.com',
      password: 'admin123'
    });
    
    if (loginResult.status !== 200) {
      console.error('❌ Error en login:', loginResult.data);
      return;
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login exitoso\n');
    
    // IDs de las canciones reales (del log del servidor)
    const parentSongId = 'cmf2lhe0y0001j9hguue9mlwg';
    const contraltoId = 'cmf2lhe1h0003j9hgzieo1hug';
    const sopranoId = 'cmf2lhe1l0005j9hg1bc89jdr';
    const tenorId = 'cmf2lhe1n0007j9hgrsihi3hc';
    
    console.log('🎵 Usando canciones reales:');
    console.log(`   Parent: ${parentSongId}`);
    console.log(`   CONTRALTO: ${contraltoId}`);
    console.log(`   SOPRANO: ${sopranoId}`);
    console.log(`   TENOR: ${tenorId}\n`);
    
    // Headers para las requests
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Test 1: Guardar letras para CONTRALTO usando el parent ID
    console.log('📝 Test 1: Guardando letras para CONTRALTO usando parent songId...');
    const contraltoResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/lyrics/${parentSongId}/text`,
      method: 'PUT',
      headers: headers
    }, {
      content: 'Letras específicas para CONTRALTO\nVoz media con armonías ricas\nNota contralto línea 3\nFinal contralto',
      voiceType: 'CONTRALTO',
      isTextOnly: true
    });
    
    console.log(`   Status: ${contraltoResult.status}`);
    if (contraltoResult.status === 200) {
      console.log(`   ✅ Guardado en songId: ${contraltoResult.data.lyric.songId}`);
      console.log(`   🎭 VoiceType: ${contraltoResult.data.lyric.voiceType}`);
      console.log(`   ✅ Debe ser CONTRALTO ID: ${contraltoId}`);
      console.log(`   📝 Coincide: ${contraltoResult.data.lyric.songId === contraltoId ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log(`   ❌ Error:`, contraltoResult.data);
    }
    
    console.log('');
    
    // Test 2: Guardar letras para SOPRANO usando el parent ID
    console.log('📝 Test 2: Guardando letras para SOPRANO usando parent songId...');
    const sopranoResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/lyrics/${parentSongId}/text`,
      method: 'PUT',
      headers: headers
    }, {
      content: 'Letras específicas para SOPRANO\nVoz aguda con melodías altas\nNota soprano línea 3\nFinal soprano',
      voiceType: 'SOPRANO',
      isTextOnly: true
    });
    
    console.log(`   Status: ${sopranoResult.status}`);
    if (sopranoResult.status === 200) {
      console.log(`   ✅ Guardado en songId: ${sopranoResult.data.lyric.songId}`);
      console.log(`   🎭 VoiceType: ${sopranoResult.data.lyric.voiceType}`);
      console.log(`   ✅ Debe ser SOPRANO ID: ${sopranoId}`);
      console.log(`   📝 Coincide: ${sopranoResult.data.lyric.songId === sopranoId ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log(`   ❌ Error:`, sopranoResult.data);
    }
    
    console.log('');
    
    // Test 3: Guardar letras para TENOR usando el ID del contralto (para probar búsqueda cross-variant)
    console.log('📝 Test 3: Guardando letras para TENOR usando contralto songId...');
    const tenorResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/lyrics/${contraltoId}/text`,
      method: 'PUT',
      headers: headers
    }, {
      content: 'Letras específicas para TENOR\nVoz aguda masculina\nNota tenor línea 3\nFinal tenor',
      voiceType: 'TENOR',
      isTextOnly: true
    });
    
    console.log(`   Status: ${tenorResult.status}`);
    if (tenorResult.status === 200) {
      console.log(`   ✅ Guardado en songId: ${tenorResult.data.lyric.songId}`);
      console.log(`   🎭 VoiceType: ${tenorResult.data.lyric.voiceType}`);
      console.log(`   ✅ Debe ser TENOR ID: ${tenorId}`);
      console.log(`   📝 Coincide: ${tenorResult.data.lyric.songId === tenorId ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log(`   ❌ Error:`, tenorResult.data);
    }
    
    console.log('');
    
    // Test 4: Verificar que las letras se pueden leer desde las variantes correctas
    console.log('📋 Test 4: Verificando lectura de letras desde cada variante...\n');
    
    for (const [voiceType, songId] of [['CONTRALTO', contraltoId], ['SOPRANO', sopranoId], ['TENOR', tenorId]]) {
      console.log(`   🔍 Verificando ${voiceType} (${songId}):`);
      
      const readResult = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/lyrics/${songId}/sync`,
        method: 'GET',
        headers: headers
      });
      
      if (readResult.status === 200 && readResult.data.lyrics && readResult.data.lyrics.length > 0) {
        console.log(`      ✅ ${readResult.data.lyrics.length} letras encontradas`);
        console.log(`      📝 Primera línea: "${readResult.data.lyrics[0].content}"`);
      } else {
        console.log(`      ❌ No se encontraron letras`);
      }
    }
    
    console.log('\n🎉 Prueba completada!');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

testRealSongs();
