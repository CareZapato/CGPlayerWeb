const fetch = require('node-fetch');

async function testLyricsSave() {
  console.log('🧪 Testing lyrics save functionality...');
  
  const baseUrl = 'http://localhost:3001/api';
  const songId = 'cmf2ok5qe00019y3o71n7pza1'; // Parent song ID
  
  // JWT token (would need to get this from login in real scenario)
  const token = 'test-token'; // En un caso real necesitarías hacer login primero
  
  const testCases = [
    {
      voiceType: 'SOPRANO',
      expectedTargetId: 'cmf2ok5qr00079y3oyj4r1m72'
    },
    {
      voiceType: 'CONTRALTO',
      expectedTargetId: 'cmf2ok5qo00059y3olnx6yhlt'
    },
    {
      voiceType: 'TENOR',
      expectedTargetId: 'cmf2ok5qt00099y3o3c03iyc6'
    },
    {
      voiceType: 'ORIGINAL',
      expectedTargetId: 'cmf2ok5ql00039y3o567zt1qe'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🎵 Testing ${testCase.voiceType}...`);
    
    const lyricsText = `0:05 Test lyric line 1 for ${testCase.voiceType}
0:10 Test lyric line 2 for ${testCase.voiceType}
0:15 Test lyric line 3 for ${testCase.voiceType}`;
    
    try {
      const response = await fetch(`${baseUrl}/lyrics/${songId}/text`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: lyricsText,
          voiceType: testCase.voiceType
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success for ${testCase.voiceType}:`);
        console.log(`   - Saved to songId: ${result.songId}`);
        console.log(`   - Expected songId: ${testCase.expectedTargetId}`);
        console.log(`   - VoiceType: ${result.voiceType}`);
        console.log(`   - Lyrics count: ${result.lyricsCount}`);
        console.log(`   - Match: ${result.songId === testCase.expectedTargetId ? '✅' : '❌'}`);
      } else {
        console.log(`❌ Error for ${testCase.voiceType}:`, result.message);
      }
    } catch (error) {
      console.log(`💥 Exception for ${testCase.voiceType}:`, error.message);
    }
  }
}

testLyricsSave().catch(console.error);
