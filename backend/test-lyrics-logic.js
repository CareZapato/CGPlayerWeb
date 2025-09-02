// Test del comportamiento actual del endpoint POST de letras
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLyricsLogic() {
  try {
    console.log('🧪 Testing lyrics endpoint logic directly...\n');

    // IDs conocidos
    const parentSongId = 'cmf2ok5qe00019y3o71n7pza1';
    const sopranoSongId = 'cmf2ok5qr00079y3oyj4r1m72';
    const tenorSongId = 'cmf2ok5qt00099y3o3c03iyc6';

    // Test 1: Simular guardado para SOPRANO (debería funcionar)
    console.log('--- Test 1: Simulate SOPRANO lyrics save ---');
    
    const song = await prisma.song.findUnique({
      where: { id: parentSongId }
    });
    
    console.log(`📊 Parent song: ${song.title} (${song.id}, voiceType: ${song.voiceType})`);
    
    // Simular la nueva lógica del endpoint
    const voiceType = 'SOPRANO';
    let targetSong = null;
    
    // Caso 1: Si el song actual ya tiene el voiceType correcto
    if (song.voiceType === voiceType) {
      targetSong = song;
      console.log(`✅ Using current song (already has correct voiceType)`);
    } else {
      // Caso 2: Buscar en hermanos
      const searchConditions = [];
      
      if (song.parentSongId) {
        searchConditions.push({ parentSongId: song.parentSongId });
        searchConditions.push({ id: song.parentSongId });
      } else {
        searchConditions.push({ parentSongId: song.id });
        searchConditions.push({ id: song.id });
      }
      
      if (searchConditions.length > 0) {
        targetSong = await prisma.song.findFirst({
          where: {
            voiceType: voiceType,
            OR: searchConditions
          },
          select: {
            id: true,
            title: true,
            voiceType: true,
            parentSongId: true
          }
        });
        
        if (targetSong) {
          console.log(`✅ Found related song: ${targetSong.title} (${targetSong.id}) with voiceType: ${targetSong.voiceType}`);
        }
      }
    }
    
    if (targetSong) {
      console.log(`✅ SOPRANO test: Would save to songId ${targetSong.id}`);
      if (targetSong.id === sopranoSongId) {
        console.log('✅ CORRECT: Target is the SOPRANO variant');
      } else {
        console.log('❌ ERROR: Target is NOT the SOPRANO variant');
      }
    } else {
      console.log('❌ SOPRANO test: No target song found (would return 404)');
    }

    console.log('\n');

    // Test 2: Simular guardado para BARITONO (debería fallar)
    console.log('--- Test 2: Simulate BARITONO lyrics save ---');
    
    const voiceType2 = 'BARITONO';
    let targetSong2 = null;
    
    // Misma lógica
    if (song.voiceType === voiceType2) {
      targetSong2 = song;
    } else {
      const searchConditions2 = [];
      
      if (song.parentSongId) {
        searchConditions2.push({ parentSongId: song.parentSongId });
        searchConditions2.push({ id: song.parentSongId });
      } else {
        searchConditions2.push({ parentSongId: song.id });
        searchConditions2.push({ id: song.id });
      }
      
      if (searchConditions2.length > 0) {
        targetSong2 = await prisma.song.findFirst({
          where: {
            voiceType: voiceType2,
            OR: searchConditions2
          }
        });
      }
    }
    
    if (targetSong2) {
      console.log(`❌ BARITONO test: Unexpected - found target song ${targetSong2.id}`);
    } else {
      console.log('✅ BARITONO test: No target song found (would return 404) - CORRECT');
    }

    console.log('\n--- Final Verification ---');
    
    // Verificar todas las variantes que existen
    const allVariants = await prisma.song.findMany({
      where: {
        OR: [
          { id: parentSongId },
          { parentSongId: parentSongId }
        ]
      },
      select: {
        id: true,
        title: true,
        voiceType: true
      }
    });
    
    console.log(`📊 All existing variants (${allVariants.length}):`);
    allVariants.forEach(v => {
      console.log(`  - ${v.voiceType || 'null'}: ${v.title} (${v.id})`);
    });
    
    // Verificar letras actuales
    console.log('\n📝 Current lyrics distribution:');
    for (const variant of allVariants) {
      const lyricsCount = await prisma.lyric.count({
        where: { songId: variant.id }
      });
      console.log(`  - ${variant.voiceType || 'null'}: ${lyricsCount} lyrics`);
    }

    console.log('\n✅ Logic test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLyricsLogic();
