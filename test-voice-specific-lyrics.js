const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@cgplayer.com',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    return null;
  }
}

// Función para crear una canción de prueba
async function createTestSong(token) {
  try {
    const response = await axios.post(`${BASE_URL}/songs`, {
      title: 'Canción de Prueba Voices',
      originalKey: 'C',
      currentKey: 'C',
      tempo: 120,
      timeSignature: '4/4',
      locationId: 'cm08g1tc00001k2bwyg0tq1g6', // Santiago
      voiceTypes: ['SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Canción creada exitosamente:');
    console.log(`   📝 Título: ${response.data.title}`);
    console.log(`   🆔 Parent ID: ${response.data.id}`);
    console.log(`   🎭 Variantes creadas: ${response.data.variants?.length || 0}`);
    
    if (response.data.variants) {
      response.data.variants.forEach(variant => {
        console.log(`      - ${variant.voiceType}: ${variant.id}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creando canción:', error.response?.data || error.message);
    return null;
  }
}

// Función para guardar letras específicas para cada tipo de voz
async function saveLyricsForVoiceType(token, songId, voiceType, content) {
  try {
    const response = await axios.put(`${BASE_URL}/lyrics/${songId}/text`, {
      content: content,
      voiceType: voiceType,
      isTextOnly: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Letras guardadas para ${voiceType}:`);
    console.log(`   🎯 Song ID usado: ${response.data.lyric.songId}`);
    console.log(`   🎭 Voice Type: ${response.data.lyric.voiceType}`);
    console.log(`   📝 Contenido: ${response.data.lyric.textContent.substring(0, 50)}...`);
    
    return response.data.lyric;
  } catch (error) {
    console.error(`Error guardando letras para ${voiceType}:`, error.response?.data || error.message);
    return null;
  }
}

// Función para verificar las letras guardadas
async function verifyLyrics(token, songId) {
  try {
    const response = await axios.get(`${BASE_URL}/lyrics/${songId}/sync`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Letras encontradas para song ${songId}:`);
    if (response.data.lyrics && response.data.lyrics.length > 0) {
      response.data.lyrics.forEach(lyric => {
        console.log(`   🎭 ${lyric.voiceType || 'GENERAL'}: ${lyric.content?.substring(0, 30)}...`);
      });
    } else {
      console.log('   ❌ No se encontraron letras');
    }
    
    return response.data.lyrics;
  } catch (error) {
    console.error(`Error verificando letras para ${songId}:`, error.response?.data || error.message);
    return null;
  }
}

// Función principal de prueba
async function testVoiceSpecificLyrics() {
  console.log('🧪 Iniciando prueba de letras específicas por tipo de voz...\n');
  
  const token = await login();
  if (!token) {
    console.error('❌ No se pudo obtener token de autenticación');
    return;
  }
  
  console.log('✅ Login exitoso\n');
  
  // Crear canción de prueba
  const song = await createTestSong(token);
  if (!song) {
    console.error('❌ No se pudo crear la canción de prueba');
    return;
  }
  
  console.log('\n📝 Guardando letras específicas para cada tipo de voz...\n');
  
  // Preparar letras diferentes para cada tipo de voz
  const voiceSpecificLyrics = {
    'SOPRANO': `Letras para SOPRANO - línea 1
Estas son las letras específicas para soprano
Con notas agudas y melodías altas
Parte exclusiva para soprano`,
    
    'CONTRALTO': `Letras para CONTRALTO - línea 1  
Estas son las letras específicas para contralto
Con notas medias y armonías ricas
Parte exclusiva para contralto`,
    
    'TENOR': `Letras para TENOR - línea 1
Estas son las letras específicas para tenor
Con notas agudas masculinas
Parte exclusiva para tenor`,
    
    'BARITONO': `Letras para BARITONO - línea 1
Estas son las letras específicas para barítono
Con notas graves y fundamentos sólidos
Parte exclusiva para barítono`
  };
  
  // Guardar letras para cada variante usando CUALQUIER songId
  // El endpoint debería encontrar automáticamente la variante correcta
  const testSongId = song.variants?.[0]?.id || song.id; // Usar cualquier songId
  
  for (const [voiceType, content] of Object.entries(voiceSpecificLyrics)) {
    console.log(`\n🎯 Guardando letras para ${voiceType} usando songId: ${testSongId}`);
    await saveLyricsForVoiceType(token, testSongId, voiceType, content);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre llamadas
  }
  
  console.log('\n🔍 Verificando letras guardadas en cada variante...\n');
  
  // Verificar que las letras se guardaron en las variantes correctas
  if (song.variants) {
    for (const variant of song.variants) {
      console.log(`\n📋 Verificando letras en ${variant.voiceType} (${variant.id}):`);
      await verifyLyrics(token, variant.id);
    }
  }
  
  console.log('\n✅ Prueba completada!');
}

// Ejecutar prueba
testVoiceSpecificLyrics().catch(console.error);
