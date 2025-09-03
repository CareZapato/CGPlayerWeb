const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSyncStatus() {
  try {
    console.log('🔄 Updating synchronization status for existing lyrics...');
    
    // Buscar todas las letras que tienen startTime > 0 pero isSynchronized = false
    const lyricsToUpdate = await prisma.lyric.findMany({
      where: {
        AND: [
          { startTime: { gt: 0 } },
          { isSynchronized: false }
        ]
      },
      select: {
        id: true,
        content: true,
        startTime: true,
        voiceType: true,
        isSynchronized: true,
        song: {
          select: {
            title: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${lyricsToUpdate.length} lyrics that need sync status update`);
    
    if (lyricsToUpdate.length > 0) {
      console.log('Sample lyrics to update:');
      lyricsToUpdate.slice(0, 5).forEach((lyric, index) => {
        console.log(`  ${index + 1}. "${lyric.content.substring(0, 40)}..." - ${lyric.song.title} (${lyric.voiceType}) - startTime: ${lyric.startTime}s - isSynchronized: ${lyric.isSynchronized}`);
      });
      
      // Actualizar en lotes
      const updateResult = await prisma.lyric.updateMany({
        where: {
          AND: [
            { startTime: { gt: 0 } },
            { isSynchronized: false }
          ]
        },
        data: {
          isSynchronized: true
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} lyrics with isSynchronized = true`);
    } else {
      console.log('✅ No lyrics need sync status update');
    }
    
    // Verificar el estado después de la actualización
    const syncedCount = await prisma.lyric.count({
      where: {
        isSynchronized: true
      }
    });
    
    const totalCount = await prisma.lyric.count();
    
    console.log(`📈 Summary: ${syncedCount}/${totalCount} lyrics are marked as synchronized`);
    
    // Mostrar específicamente "Don't Cry" letras
    const dontCryLyrics = await prisma.lyric.findMany({
      where: {
        song: {
          title: {
            contains: 'Dont Cry',
            mode: 'insensitive'
          }
        }
      },
      select: {
        id: true,
        content: true,
        startTime: true,
        voiceType: true,
        isSynchronized: true,
        song: {
          select: {
            title: true
          }
        }
      }
    });
    
    console.log(`\n🎵 Don't Cry lyrics status:`);
    dontCryLyrics.forEach((lyric, index) => {
      console.log(`  ${index + 1}. "${lyric.content.substring(0, 30)}..." - ${lyric.song.title} (${lyric.voiceType}) - startTime: ${lyric.startTime}s - isSynchronized: ${lyric.isSynchronized}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating sync status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSyncStatus();
