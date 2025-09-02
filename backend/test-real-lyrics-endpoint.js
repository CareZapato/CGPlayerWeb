const axios = require('axios');

// Configurar la URL base del API
const API_BASE = 'http://localhost:3001/api';

// Token de autenticación (puedes obtenerlo del localStorage o hacer login)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWYyMnA2Y2EwMDA2ZWl1Z3o3N2hqM2RjIiwiaWF0IjoxNzM1ODMxNjMwfQ.XHayI6QOKnCgPPDxQiT8I7HGZYhKLRTqBEy9TgMK1m0';

async function testLyricsEndpoint() {
  try {
    console.log('🧪 Testing fixed lyrics endpoint...\n');

    // IDs de las canciones (obtenidos del análisis anterior)
    const parentSongId = 'cmf2ok5qe00019y3o71n7pza1';
    const sopranoSongId = 'cmf2ok5qr00079y3oyj4r1m72';
    
    const testLyrics = `1:10 Test line for specific voice
1:20 This should save to correct song
1:30 No more wrong songIds`;

    console.log('📋 Test Plan:');
    console.log('1. Try to save lyrics for SOPRANO (should work - song exists)');
    console.log('2. Try to save lyrics for BARITONO (should fail - song does not exist)');
    console.log('3. Verify lyrics are saved to correct songIds\n');

    // Test 1: Guardar letras para SOPRANO (debería funcionar)
    console.log('--- Test 1: Saving lyrics for SOPRANO (should work) ---');
    try {
      const response1 = await axios.put(
        `${API_BASE}/lyrics/${parentSongId}/text`,
        {
          text: testLyrics,
          voiceType: 'SOPRANO'
        },
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ SOPRANO lyrics saved successfully!');
      console.log(`📊 Response: ${response1.data.message}`);
      console.log(`🎯 Target songId: ${response1.data.songId}`);
      console.log(`🎵 VoiceType: ${response1.data.voiceType}`);
      console.log(`📝 Lyrics count: ${response1.data.lyricsCount}`);
      
      if (response1.data.songId === sopranoSongId) {
        console.log('✅ CORRECT: Lyrics saved to SOPRANO song variant');
      } else {
        console.log('❌ ERROR: Lyrics saved to wrong songId');
      }

    } catch (error) {
      console.log('❌ Failed to save SOPRANO lyrics:', error.response?.data?.message || error.message);
    }

    console.log('\n');

    // Test 2: Intentar guardar letras para BARITONO (debería fallar)
    console.log('--- Test 2: Saving lyrics for BARITONO (should fail) ---');
    try {
      const response2 = await axios.put(
        `${API_BASE}/lyrics/${parentSongId}/text`,
        {
          text: testLyrics,
          voiceType: 'BARITONO'
        },
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('❌ UNEXPECTED: BARITONO lyrics were saved (this should not happen)');
      console.log(`📊 Response: ${response2.data.message}`);

    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ CORRECT: BARITONO request was rejected with 404');
        console.log(`📊 Error message: ${error.response.data.message}`);
        console.log(`🚫 Error code: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n');

    // Test 3: Verificar que las letras están en el lugar correcto
    console.log('--- Test 3: Verifying lyrics are in correct places ---');
    
    try {
      // Verificar letras en SOPRANO song
      const sopranoLyrics = await axios.get(
        `${API_BASE}/lyrics/${sopranoSongId}/sync?voiceType=SOPRANO`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        }
      );

      console.log(`📋 SOPRANO song lyrics: ${sopranoLyrics.data.lyrics.length} entries`);
      if (sopranoLyrics.data.lyrics.length > 0) {
        console.log('✅ CORRECT: SOPRANO song has lyrics');
        console.log(`🎯 Song ID in response: ${sopranoLyrics.data.songId}`);
      }

    } catch (error) {
      console.log('❌ Error fetching SOPRANO lyrics:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log('- Lyrics should only save to existing song variants');
    console.log('- Non-existing voice types should be rejected');
    console.log('- Each variant gets its own lyrics with correct songId');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testLyricsEndpoint();
