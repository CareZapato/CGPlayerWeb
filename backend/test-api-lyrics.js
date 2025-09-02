const { PrismaClient } = require('@prisma/client');
const http = require('http');
const prisma = new PrismaClient();

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

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing API lyrics endpoint...');
    
    // 1. Probar guardar letras para CONTRALTO
    const contraltoSongId = 'cmf2mnki50003lkinvmro7c5z';
    const testLyrics = `Esta es una letra de prueba para CONTRALTO desde la API
Esta es la segunda línea para CONTRALTO
Esta es la tercera línea para CONTRALTO
Esta es la cuarta línea específica para CONTRALTO`;
    
    console.log(`📝 Saving lyrics for CONTRALTO song: ${contraltoSongId}`);
    
    const saveResponse = await makeRequest(`/api/lyrics/${contraltoSongId}/text`, 'PUT', {
      text: testLyrics,
      voiceType: 'CONTRALTO'
    });
    
    console.log(`📝 Save response status: ${saveResponse.status}`);
    console.log(`📝 Save response:`, saveResponse.data);
    
    if (saveResponse.status === 200) {
      console.log('✅ Lyrics saved successfully via API!');
      
      // 2. Verificar en la base de datos
      console.log('🔍 Verifying in database...');
      const savedLyrics = await prisma.lyric.findMany({
        where: {
          songId: contraltoSongId,
          voiceType: 'CONTRALTO'
        },
        orderBy: {
          lineNumber: 'asc'
        }
      });
      
      console.log(`📋 Found ${savedLyrics.length} lyrics in database:`);
      savedLyrics.forEach((lyric, index) => {
        console.log(`  [${index + 1}] "${lyric.content}" (startTime: ${lyric.startTime}s, voiceType: ${lyric.voiceType})`);
      });
      
      // 3. Probar recuperar letras via API
      console.log('\\n🔍 Testing retrieve lyrics via API...');
      const retrieveResponse = await makeRequest(`/api/lyrics/${contraltoSongId}/sync`);
      
      console.log(`📖 Retrieve response status: ${retrieveResponse.status}`);
      if (retrieveResponse.status === 200) {
        console.log(`📖 Retrieved ${retrieveResponse.data.lyrics.length} lyrics via API:`);
        retrieveResponse.data.lyrics.forEach((lyric, index) => {
          console.log(`  [${index + 1}] "${lyric.text}" (tiempo: ${lyric.tiempo}s, voiceType: ${lyric.voiceType})`);
        });
        console.log('✅ Retrieve test successful!');
      } else {
        console.log('❌ Failed to retrieve lyrics:', retrieveResponse.data);
      }
      
    } else {
      console.log('❌ Failed to save lyrics:', saveResponse.data);
    }
    
    console.log('\\n🎯 API test completed!');
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

testAPIEndpoint();
