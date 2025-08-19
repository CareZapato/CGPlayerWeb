import { prisma } from '../utils/prisma';

async function deleteSongsWithoutFiles() {
  try {
    console.log('🗑️ Eliminando canciones sin archivos de audio...\n');

    // Canciones a eliminar (que no tienen archivos reales)
    const songsToDelete = [
      'Amazing Grace',
      'Be Still My Soul', 
      'How Great Thou Art'
    ];

    for (const songTitle of songsToDelete) {
      console.log(`🔍 Buscando canciones con título: "${songTitle}"`);
      
      // Buscar canción principal
      const parentSong = await prisma.song.findFirst({
        where: {
          title: songTitle,
          parentSongId: null
        }
      });

      if (parentSong) {
        console.log(`  📍 Encontrada canción principal: ${parentSong.id}`);
        
        // Buscar todas las versiones (variaciones)
        const variations = await prisma.song.findMany({
          where: {
            parentSongId: parentSong.id
          }
        });

        console.log(`  🎵 Encontradas ${variations.length} variaciones`);

        // Eliminar variaciones primero
        if (variations.length > 0) {
          const deletedVariations = await prisma.song.deleteMany({
            where: {
              parentSongId: parentSong.id
            }
          });
          console.log(`  ✅ Eliminadas ${deletedVariations.count} variaciones`);
        }

        // Eliminar canción principal
        await prisma.song.delete({
          where: {
            id: parentSong.id
          }
        });
        console.log(`  ✅ Eliminada canción principal`);
        
      } else {
        console.log(`  ⚠️ No se encontró canción principal con título: "${songTitle}"`);
      }
      
      console.log('');
    }

    console.log('🎉 Proceso completado!\n');

    // Verificar estado final
    const remainingSongs = await prisma.song.findMany({
      where: {
        parentSongId: null,
        isActive: true
      },
      select: {
        title: true,
        artist: true
      }
    });

    console.log('📋 Canciones principales restantes:');
    remainingSongs.forEach((song, index) => {
      console.log(`  ${index + 1}. "${song.title}" by ${song.artist}`);
    });

  } catch (error) {
    console.error('❌ Error eliminando canciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSongsWithoutFiles();
