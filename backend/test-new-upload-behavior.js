const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewSongUpload() {
  try {
    console.log('🧪 Testing new song upload fix...\n');

    // 1. Limpiar canción de prueba anterior si existe
    const existingSong = await prisma.song.findFirst({
      where: {
        title: {
          startsWith: 'Total Praise'
        },
        voiceType: null
      }
    });

    if (existingSong) {
      console.log(`🧹 Found existing test song: ${existingSong.title} (${existingSong.id})`);
      
      // Eliminar letras asociadas
      const lyricsCount = await prisma.lyric.deleteMany({
        where: {
          OR: [
            { songId: existingSong.id },
            { song: { parentSongId: existingSong.id } }
          ]
        }
      });
      console.log(`🗑️ Deleted ${lyricsCount.count} existing lyrics`);

      // Eliminar variantes
      const variantsCount = await prisma.song.deleteMany({
        where: { parentSongId: existingSong.id }
      });
      console.log(`🗑️ Deleted ${variantsCount.count} variants`);

      // Eliminar canción padre
      await prisma.song.delete({
        where: { id: existingSong.id }
      });
      console.log(`🗑️ Deleted parent song`);
    }

    console.log('\n📋 Ready to test new upload behavior');
    console.log('✅ When you upload a new song now, it should:');
    console.log('  1. Create lyrics only for uploaded variants (not all voice types)');
    console.log('  2. Save each variant\'s lyrics to its specific songId');
    console.log('  3. Not save all lyrics to parent songId\n');

    console.log('🎯 Upload a song with specific voice types and check the logs!');
    console.log('📊 Expected behavior:');
    console.log('  - If you upload CONTRALTO, SOPRANO, TENOR');
    console.log('  - Should create lyrics for: null (parent) + CONTRALTO + SOPRANO + TENOR');
    console.log('  - Should NOT create lyrics for: BARITONO, BAJO, CORO, MESOSOPRANO');
    console.log('  - Each should have different songIds\n');

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewSongUpload();
