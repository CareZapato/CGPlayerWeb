// Script para probar la nueva funcionalidad de guardado de letras
const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWYyMnA2Y2EwMDA2ZWl1Z3o3N2hqM2RjIiwiZW1haWwiOiJhZG1pbkBjZ3BsYXllci5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3NTY4MjIyNTEsImV4cCI6MTc1NzQyNzA1MX0.6bHHG4ZQqDeCH15prDl6a3WBt2VSivRVi1tqJnAb5d8'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testLyricsSystem() {
  console.log('🔍 Testing new lyrics system...');
  
  try {
    // 1. Buscar canciones disponibles  
    console.log('📋 Step 1: Searching for songs...');
    const songsResponse = await makeRequest('/api/songs?search=do%20you%20know&limit=3');
    
    if (songsResponse.status === 200 && songsResponse.data.songs) {
      console.log(`✅ Found ${songsResponse.data.songs.length} songs:`);
      songsResponse.data.songs.forEach(song => {
        console.log(`  - "${song.title}" (ID: ${song.id}, voiceType: ${song.voiceType})`);
      });
      
      // Buscar una canción con CONTRALTO
      const contraltoSong = songsResponse.data.songs.find(s => s.voiceType === 'CONTRALTO');
      
      if (contraltoSong) {
        console.log(`🎯 Using CONTRALTO song: ${contraltoSong.title} (${contraltoSong.id})`);
        
        // 2. Probar guardar letras para CONTRALTO
        console.log('📝 Step 2: Saving lyrics for CONTRALTO...');
        
        const testLyrics = `Esta es la primera línea de la letra para CONTRALTO
Segunda línea de la letra para CONTRALTO
Tercera línea de la letra para CONTRALTO
Esta es la cuarta línea muy específica para CONTRALTO`;
        
        const saveResponse = await makeRequest(`/api/lyrics/${contraltoSong.id}/text`, 'PUT', {
          text: testLyrics,
          voiceType: 'CONTRALTO'
        });
        
        console.log(`📝 Save response status: ${saveResponse.status}`);
        console.log(`📝 Save response:`, JSON.stringify(saveResponse.data, null, 2));
        
        if (saveResponse.status === 200) {
          console.log('✅ Lyrics saved successfully!');
          
          // 3. Verificar que las letras se guardaron correctamente
          console.log('🔍 Step 3: Retrieving saved lyrics...');
          
          const getResponse = await makeRequest(`/api/lyrics/${contraltoSong.id}/sync?voiceType=CONTRALTO`);
          console.log(`📋 Get response status: ${getResponse.status}`);
          console.log(`📋 Retrieved lyrics:`, JSON.stringify(getResponse.data, null, 2));
          
          if (getResponse.status === 200 && getResponse.data.lyrics && getResponse.data.lyrics.length > 0) {
            console.log('✅ SUCCESS! Lyrics were saved and retrieved correctly!');
            console.log(`🎯 Found ${getResponse.data.lyrics.length} lyrics entries for CONTRALTO`);
            console.log(`🎯 Saved in songId: ${getResponse.data.songId} (should be ${contraltoSong.id})`);
            
            if (getResponse.data.songId === contraltoSong.id) {
              console.log('🎉 PERFECT! songId assignment is working correctly!');
            } else {
              console.log('❌ PROBLEM: songId assignment is still incorrect');
            }
          } else {
            console.log('❌ FAILED: No lyrics retrieved');
          }
        } else {
          console.log('❌ FAILED to save lyrics');
        }
      } else {
        console.log('⚠️ No CONTRALTO song found, searching for any song with voiceType...');
        
        const songWithVoice = songsResponse.data.songs.find(s => s.voiceType);
        if (songWithVoice) {
          console.log(`🎯 Using ${songWithVoice.voiceType} song: ${songWithVoice.title} (${songWithVoice.id})`);
          
          // Probar con el voiceType disponible
          const testLyrics = `Letra de prueba para ${songWithVoice.voiceType}
Segunda línea para ${songWithVoice.voiceType}
Tercera línea para ${songWithVoice.voiceType}`;

          const saveResponse = await makeRequest(`/api/lyrics/${songWithVoice.id}/text`, 'PUT', {
            text: testLyrics,
            voiceType: songWithVoice.voiceType
          });
          
          console.log(`📝 Save response:`, JSON.stringify(saveResponse.data, null, 2));
        }
      }
    } else {
      console.log('❌ Failed to get songs:', songsResponse.status, songsResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLyricsSystem();
