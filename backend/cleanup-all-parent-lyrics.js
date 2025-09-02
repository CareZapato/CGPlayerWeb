const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAllParentLyrics() {
  try {
    console.log('🧹 Limpiando letras incorrectas de todas las canciones padre...');
    
    // Buscar todas las canciones padre que tienen letras (incorrecto)
    const parentSongsWithLyrics = await prisma.song.findMany({
      where: {
        voiceType: null,
        lyrics: {
          some: {}
        }
      },
      include: {
        lyrics: true,
        childVersions: true
      }
    });
    
    console.log(`📋 Encontradas ${parentSongsWithLyrics.length} canciones padre con letras incorrectas:`);
    
    let totalLyricsDeleted = 0;
    
    for (const song of parentSongsWithLyrics) {
      console.log(`\n🗑️ Procesando: ${song.title}`);
      console.log(`   - Letras a eliminar: ${song.lyrics.length}`);
      console.log(`   - Variantes: ${song.childVersions.length}`);
      
      // Eliminar todas las letras del padre
      const deleted = await prisma.lyric.deleteMany({
        where: {
          songId: song.id
        }
      });
      
      totalLyricsDeleted += deleted.count;
      console.log(`   ✅ Eliminadas ${deleted.count} letras del padre`);
    }
    
    console.log(`\n🎉 LIMPIEZA COMPLETADA:`);
    console.log(`   - Canciones procesadas: ${parentSongsWithLyrics.length}`);
    console.log(`   - Total letras eliminadas: ${totalLyricsDeleted}`);
    
    // Verificar el resultado
    console.log('\n🔍 Verificando resultado...');
    const remainingParentLyrics = await prisma.song.count({
      where: {
        voiceType: null,
        lyrics: {
          some: {}
        }
      }
    });
    
    if (remainingParentLyrics === 0) {
      console.log('✅ ¡PERFECTO! No quedan letras en canciones padre');
    } else {
      console.log(`⚠️ Aún quedan ${remainingParentLyrics} canciones padre con letras`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllParentLyrics();
