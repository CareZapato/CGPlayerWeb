const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSongs() {
  try {
    const songs = await prisma.song.findMany({
      where: {
        title: { contains: 'Do you Know' }
      },
      select: {
        id: true,
        title: true,
        voiceType: true
      }
    });
    
    console.log('Songs found:');
    songs.forEach(song => {
      console.log(`- ${song.title} (id: ${song.id}, voiceType: ${song.voiceType})`);
    });
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e);
  }
}

checkSongs();
