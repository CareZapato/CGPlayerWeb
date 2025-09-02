const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupBloodLyrics() {
  try {
    console.log('🧹 Limpiando letras duplicadas de la canción "Blood"...');
    
    // Buscar la canción Blood (padre)
    const parentSong = await prisma.song.findFirst({
      where: {
        title: 'Blood',
        voiceType: null
      },
      include: {
        childVersions: {
          include: {
            lyrics: true
          }
        },
        lyrics: true
      }
    });
    
    if (!parentSong) {
      console.log('❌ No se encontró la canción Blood');
      return;
    }
    
    console.log('📋 Información de la canción Blood:');
    console.log('- ID del padre:', parentSong.id);
    console.log('- Letras en el padre:', parentSong.lyrics.length);
    console.log('- Variantes encontradas:', parentSong.childVersions.length);
    
    // Mostrar información de las variantes
    for (const child of parentSong.childVersions) {
      console.log(`- ${child.voiceType}: ${child.lyrics.length} letras`);
    }
    
    // Eliminar letras del padre (no debería tenerlas)
    if (parentSong.lyrics.length > 0) {
      console.log('🗑️ Eliminando letras del padre...');
      await prisma.lyric.deleteMany({
        where: {
          songId: parentSong.id
        }
      });
      console.log(`✅ Eliminadas ${parentSong.lyrics.length} letras del padre`);
    }
    
    console.log('✅ Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBloodLyrics();
