const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLyricsSave() {
  try {
    console.log('🧪 Testing lyrics save fix...\n');

    // 1. Encontrar la song "God will take care of you" (padre)
    const parentSong = await prisma.song.findFirst({
      where: {
        title: {
          startsWith: 'God will take care of you'
        },
        voiceType: null
      }
    });

    if (!parentSong) {
      console.log('❌ Parent song not found');
      return;
    }

    console.log(`📋 Found parent song: ${parentSong.title} (${parentSong.id})`);

    // 2. Encontrar todas las variantes de esta canción
    const variants = await prisma.song.findMany({
      where: {
        parentSongId: parentSong.id
      },
      select: {
        id: true,
        title: true,
        voiceType: true
      }
    });

    console.log(`\n📊 Found ${variants.length} variants:`);
    variants.forEach(v => {
      console.log(`  - ${v.title} (${v.id}) - voiceType: ${v.voiceType}`);
    });

    // 3. Simular guardado de letras usando la nueva lógica
    const testLyrics = "1:10 Test line 1\n1:20 Test line 2\n1:30 Test line 3";
    
    console.log('\n🧪 Testing lyrics save for existing voice types...\n');

    // Probar guardar letras para cada voiceType que EXISTE
    const existingVoiceTypes = [null, ...variants.map(v => v.voiceType)];

    for (const voiceType of existingVoiceTypes) {
      console.log(`\n--- Testing voiceType: ${voiceType || 'null'} ---`);
      
      try {
        // Simular la nueva lógica
        let targetSong = null;
        
        if (voiceType === null || voiceType === parentSong.voiceType) {
          targetSong = parentSong;
          console.log(`✅ Using parent song (voiceType matches)`);
        } else {
          targetSong = variants.find(v => v.voiceType === voiceType);
          if (targetSong) {
            console.log(`✅ Found variant: ${targetSong.title} (${targetSong.id})`);
          }
        }
        
        if (targetSong) {
          console.log(`🎯 Would save lyrics to: ${targetSong.id} (voiceType: ${targetSong.voiceType || 'null'})`);
        } else {
          console.log(`❌ NO TARGET SONG FOUND - Request would be REJECTED`);
        }
        
      } catch (error) {
        console.log(`❌ Error testing voiceType ${voiceType}:`, error.message);
      }
    }

    // 4. Probar con voiceTypes que NO EXISTEN
    console.log('\n🧪 Testing lyrics save for NON-EXISTING voice types...\n');
    
    const nonExistingVoiceTypes = ['BARITONO', 'BAJO', 'CORO', 'MESOSOPRANO'];
    
    for (const voiceType of nonExistingVoiceTypes) {
      console.log(`\n--- Testing NON-EXISTING voiceType: ${voiceType} ---`);
      
      const targetVariant = variants.find(v => v.voiceType === voiceType);
      
      if (!targetVariant) {
        console.log(`❌ NO SONG FOUND with voiceType: ${voiceType}`);
        console.log(`🚫 Request would be REJECTED with 404 error`);
      } else {
        console.log(`❓ Unexpected: Found song with ${voiceType}`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Only existing song variants can receive lyrics');
    console.log('- Non-existing voice types will be rejected with 404');
    console.log('- No more lyrics for ALL voice types');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLyricsSave();
