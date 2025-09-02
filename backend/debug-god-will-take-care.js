const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSongStructure() {
  try {
    console.log('🔍 Analyzing new song structure for God will take care of you...');
    
    // Buscar todas las canciones relacionadas
    const allSongs = await prisma.song.findMany({
      where: {
        title: { contains: 'God will take care' }
      },
      select: {
        id: true,
        title: true,
        voiceType: true,
        parentSongId: true
      },
      orderBy: { title: 'asc' }
    });
    
    console.log('📋 Found songs:');
    allSongs.forEach(song => {
      const parent = song.parentSongId ? ` (parent: ${song.parentSongId})` : ' (NO PARENT)';
      console.log(`  - ${song.title} | ID: ${song.id} | voiceType: ${song.voiceType || 'null'}${parent}`);
    });
    
    // Verificar letras existentes
    console.log('\\n📝 Checking existing lyrics...');
    const lyrics = await prisma.lyric.findMany({
      where: {
        song: {
          title: { contains: 'God will take care' }
        }
      },
      select: {
        id: true,
        songId: true,
        voiceType: true,
        content: true,
        song: {
          select: {
            title: true,
            voiceType: true
          }
        }
      }
    });
    
    console.log(`📝 Found ${lyrics.length} existing lyrics:`);
    lyrics.forEach(lyric => {
      console.log(`  - Lyric songId: ${lyric.songId} | voiceType: ${lyric.voiceType} | Song: ${lyric.song.title} (voiceType: ${lyric.song.voiceType})`);
      console.log(`    Content: ${lyric.content.substring(0, 50)}...`);
    });
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e);
    await prisma.$disconnect();
  }
}

debugSongStructure();
