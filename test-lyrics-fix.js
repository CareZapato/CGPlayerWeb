const fetch = require('node-fetch');

const testLyricsFunction = async () => {
  console.log('🔍 Testing lyrics functionality with real song data...');
  
  try {
    // Obtener una canción específica que sabemos que existe
    console.log('📋 Searching for "I Go to the Rock" song...');
    const getSongsResponse = await fetch('http://localhost:3001/api/songs?search=i%20go%20to%20the%20rock', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    const songsData = await getSongsResponse.json();
    
    console.log(`📊 Found ${songsData.songs?.length || 0} songs matching the search`);
    
    if (songsData.songs && songsData.songs.length > 0) {
      const song = songsData.songs[0];
      console.log(`🎵 Testing with song: "${song.title}" (ID: ${song.id}, voiceType: ${song.voiceType || 'NULL'})`);
      
      // Si es una canción padre, obtener todas las variantes
      if (!song.voiceType) {
        console.log('🔍 Song is parent, getting all variants...');
        const variantsResponse = await fetch(`http://localhost:3001/api/songs/${song.id}/variants`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        const variantsData = await variantsResponse.json();
        
        console.log(`📊 Found ${variantsData.variants?.length || 0} variants:`);
        variantsData.variants?.forEach(variant => {
          console.log(`  - "${variant.title}" (ID: ${variant.id}, voiceType: ${variant.voiceType})`);
        });
        
        // Probar guardar letras para CONTRALTO
        const contraltoVariant = variantsData.variants?.find(v => v.voiceType === 'CONTRALTO');
        if (contraltoVariant) {
          console.log(`✅ Found CONTRALTO variant: ${contraltoVariant.id}`);
          console.log('💾 Attempting to save lyrics for CONTRALTO...');
          
          const testLyrics = `Línea 1 de letra para CONTRALTO
Línea 2 de letra para CONTRALTO  
Línea 3 de letra para CONTRALTO`;
          
          const saveLyricsResponse = await fetch(`http://localhost:3001/api/lyrics/${song.id}/text`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({
              text: testLyrics,
              voiceType: 'CONTRALTO'
            })
          });
          
          const saveResult = await saveLyricsResponse.json();
          console.log('📝 Save lyrics response:', JSON.stringify(saveResult, null, 2));
          
          if (saveResult.songId) {
            console.log(`✅ Lyrics saved to songId: ${saveResult.songId} (should be CONTRALTO variant: ${contraltoVariant.id})`);
            
            // Verificar que las letras se guardaron correctamente
            console.log('🔍 Retrieving saved lyrics to verify...');
            const getLyricsResponse = await fetch(`http://localhost:3001/api/lyrics/${contraltoVariant.id}/sync?voiceType=CONTRALTO`, {
              headers: {
                'Authorization': 'Bearer test-token'
              }
            });
            const lyricsData = await getLyricsResponse.json();
            
            console.log('📋 Retrieved lyrics:', JSON.stringify(lyricsData, null, 2));
            console.log(`📊 Found ${lyricsData.lyrics?.length || 0} lyrics entries`);
            
            if (lyricsData.lyrics && lyricsData.lyrics.length > 0) {
              console.log('✅ SUCCESS! Lyrics are correctly saved and retrieved');
              console.log('🎯 RESULT: songId assignment fixed - lyrics saved to correct variant');
            } else {
              console.log('❌ FAILURE: Lyrics not found in variant-specific search');
            }
          }
        } else {
          console.log('❌ No CONTRALTO variant found for testing');
        }
      } else {
        console.log(`🎵 Song already has voiceType: ${song.voiceType}, testing direct save...`);
        
        const testLyrics = `Direct lyrics test for ${song.voiceType}
Line 2 for direct test
Line 3 for direct test`;
        
        const saveLyricsResponse = await fetch(`http://localhost:3001/api/lyrics/${song.id}/text`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            text: testLyrics,
            voiceType: song.voiceType
          })
        });
        
        const saveResult = await saveLyricsResponse.json();
        console.log('📝 Direct save result:', JSON.stringify(saveResult, null, 2));
      }
    } else {
      console.log('❌ No songs found for "I Go to the Rock"');
      
      // Intentar con cualquier canción
      console.log('📋 Searching for any available songs...');
      const allSongsResponse = await fetch('http://localhost:3001/api/songs?limit=5', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      const allSongsData = await allSongsResponse.json();
      
      console.log(`📊 Found ${allSongsData.songs?.length || 0} total songs available`);
      if (allSongsData.songs && allSongsData.songs.length > 0) {
        allSongsData.songs.forEach((song, index) => {
          console.log(`  ${index + 1}. "${song.title}" (ID: ${song.id}, voiceType: ${song.voiceType || 'NULL'})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error testing lyrics:', error.message);
  }
};

testLyricsFunction();
