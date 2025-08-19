import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testForPlaylistEndpoint() {
  try {
    console.log('🔍 Testing for-playlist logic...');

    // Simular lógica del endpoint
    const userId = 'cmehzlge00000urcqmvl3jff7'; // ID del admin
    const userRoles = ['ADMIN'];
    const search = '';
    
    // Verificar si el usuario es ADMIN o DIRECTOR
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    console.log('👤 User roles:', { isAdmin, isDirector, isCantante });

    let whereClause: any = {
      isActive: true,
      parentSongId: { not: null }, // Solo variaciones (canciones con parentId)
      voiceType: { not: null } // Y que tengan voiceType definido
    };

    console.log('🎯 Initial whereClause:', whereClause);

    // Obtener canciones compatibles
    const songs = await prisma.song.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        artist: true,
        duration: true,
        voiceType: true,
        parentSongId: true,
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { title: 'asc' },
        { artist: 'asc' }
      ]
    });

    console.log(`✅ Found ${songs.length} songs for playlist`);
    
    if (songs.length > 0) {
      console.log('📋 Sample songs:');
      songs.slice(0, 3).forEach(song => {
        console.log(`   - ${song.title} (${song.voiceType}) by ${song.uploader.firstName} ${song.uploader.lastName}`);
      });
    }

    // También verificar todas las canciones en la DB
    const allSongs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        parentSongId: true,
        voiceType: true,
        isActive: true
      }
    });

    console.log(`\n📊 Database status:`);
    console.log(`   Total songs: ${allSongs.length}`);
    console.log(`   Active songs: ${allSongs.filter(s => s.isActive).length}`);
    console.log(`   Songs with parentId: ${allSongs.filter(s => s.parentSongId !== null).length}`);
    console.log(`   Songs with voiceType: ${allSongs.filter(s => s.voiceType !== null).length}`);
    console.log(`   Songs matching criteria: ${allSongs.filter(s => s.isActive && s.parentSongId !== null && s.voiceType !== null).length}`);

  } catch (error) {
    console.error('❌ Error testing logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testForPlaylistEndpoint();
