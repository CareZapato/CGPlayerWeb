// Script de prueba para verificar el guardado correcto de letras por tipo de voz
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
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function testLyricsCorrection() {
  console.log('🧪 Iniciando prueba de corrección de guardado de letras...\n');
  
  try {
    // 1. Login
    console.log('🔐 Haciendo login...');
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
    
    // 2. Crear canción con variantes
    console.log('🎵 Creando canción con variantes SOPRANO y CONTRALTO...');
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
      title: 'Test Correction Lyrics',
      originalKey: 'C',
      currentKey: 'C',
      tempo: 120,
      timeSignature: '4/4',
      locationId: 'cm08g1tc00001k2bwyg0tq1g6',
      voiceTypes: ['SOPRANO', 'CONTRALTO']
    });
    
    if (songResult.status !== 201) {
      console.error('❌ Error creando canción:', songResult.data);
      return;
    }
    
    console.log('✅ Canción creada:', songResult.data.title);
    console.log('🆔 Parent Song ID:', songResult.data.id);
    
    if (!songResult.data.variants || songResult.data.variants.length === 0) {
      console.error('❌ No se crearon variantes');
      return;
    }
    
    // Mostrar todas las variantes creadas
    console.log('🎭 Variantes creadas:');
    songResult.data.variants.forEach(variant => {
      console.log(`   - ${variant.voiceType}: ${variant.id}`);
    });
    
    const sopranoVariant = songResult.data.variants.find(v => v.voiceType === 'SOPRANO');
    const contraltoVariant = songResult.data.variants.find(v => v.voiceType === 'CONTRALTO');
    
    if (!sopranoVariant || !contraltoVariant) {
      console.error('❌ No se encontraron variantes SOPRANO o CONTRALTO');
      return;
    }
    
    // 3. Usar el ID del padre para guardar letras (debería encontrar automáticamente las variantes)
    const parentSongId = songResult.data.id;
    
    console.log('\\n📝 Guardando letras usando el parent songId:', parentSongId);
    console.log('   El sistema debería encontrar automáticamente las variantes correctas...\\n');
    
    // 4. Guardar letras para SOPRANO
    console.log('🎵 Guardando letras para SOPRANO...');
    const sopranoLyricsResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/lyrics/${parentSongId}/text`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      content: 'Letras específicas para SOPRANO\\nNotas agudas y melodías altas\\nParte exclusiva para soprano\\nÚltima línea de soprano',
      voiceType: 'SOPRANO',
      isTextOnly: true
    });
    
    console.log('📊 Status SOPRANO:', sopranoLyricsResult.status);
    if (sopranoLyricsResult.status === 200) {
      console.log('✅ SOPRANO - Éxito');
      console.log(`   🎯 Guardado en songId: ${sopranoLyricsResult.data.lyric.songId}`);
      console.log(`   🎭 VoiceType: ${sopranoLyricsResult.data.lyric.voiceType}`);
      console.log(`   ✅ Debe ser igual al ID de la variante SOPRANO: ${sopranoVariant.id}`);
      console.log(`   📝 Coincide: ${sopranoLyricsResult.data.lyric.songId === sopranoVariant.id ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.error('❌ Error guardando SOPRANO:', sopranoLyricsResult.data);
    }
    
    console.log('');
    
    // 5. Guardar letras para CONTRALTO
    console.log('🎵 Guardando letras para CONTRALTO...');
    const contraltoLyricsResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/lyrics/${parentSongId}/text`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      content: 'Letras específicas para CONTRALTO\\nNotas medias y armonías ricas\\nParte exclusiva para contralto\\nÚltima línea de contralto',
      voiceType: 'CONTRALTO',
      isTextOnly: true
    });
    
    console.log('📊 Status CONTRALTO:', contraltoLyricsResult.status);
    if (contraltoLyricsResult.status === 200) {
      console.log('✅ CONTRALTO - Éxito');
      console.log(`   🎯 Guardado en songId: ${contraltoLyricsResult.data.lyric.songId}`);
      console.log(`   🎭 VoiceType: ${contraltoLyricsResult.data.lyric.voiceType}`);
      console.log(`   ✅ Debe ser igual al ID de la variante CONTRALTO: ${contraltoVariant.id}`);
      console.log(`   📝 Coincide: ${contraltoLyricsResult.data.lyric.songId === contraltoVariant.id ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.error('❌ Error guardando CONTRALTO:', contraltoLyricsResult.data);
    }
    
    console.log('\\n🎉 Prueba completada!');
    console.log('\\n📊 RESUMEN:');
    console.log(`   🎵 Canción padre creada: ${parentSongId}`);
    console.log(`   🎭 Variante SOPRANO: ${sopranoVariant.id}`);
    console.log(`   🎭 Variante CONTRALTO: ${contraltoVariant.id}`);
    
    if (sopranoLyricsResult.status === 200 && contraltoLyricsResult.status === 200) {
      const sopranoCorrect = sopranoLyricsResult.data.lyric.songId === sopranoVariant.id;
      const contraltoCorrect = contraltoLyricsResult.data.lyric.songId === contraltoVariant.id;
      
      if (sopranoCorrect && contraltoCorrect) {
        console.log('\\n🎉 ¡ÉXITO TOTAL! Las letras se guardaron en los songIds correctos de cada variante.');
      } else {
        console.log('\\n⚠️ Hay problemas: Las letras no se guardaron en los songIds correctos.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar prueba
testLyricsCorrection();
