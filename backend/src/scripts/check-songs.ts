import { prisma } from '../utils/prisma';

async function checkSongs() {
  try {
    console.log('📋 Canciones en la base de datos:');
    const songs = await prisma.song.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        artist: true,
        parentSongId: true,
        filePath: true,
        voiceType: true
      },
      orderBy: { title: 'asc' }
    });

    console.log(`\n🎵 Total de canciones activas: ${songs.length}\n`);
    
    songs.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" by ${song.artist}`);
      console.log(`   ID: ${song.id}`);
      console.log(`   Parent: ${song.parentSongId || 'None (Canción principal)'}`);
      console.log(`   Voice Type: ${song.voiceType || 'N/A'}`);
      console.log(`   File Path: ${song.filePath}`);
      console.log('');
    });

    // Agrupar por canción principal
    const parentSongs = songs.filter(s => !s.parentSongId);
    console.log('🎼 Canciones principales:');
    parentSongs.forEach(parent => {
      console.log(`- "${parent.title}" by ${parent.artist}`);
      const versions = songs.filter(s => s.parentSongId === parent.id);
      if (versions.length > 0) {
        console.log(`  Versiones (${versions.length}):`);
        versions.forEach(v => {
          console.log(`    - ${v.voiceType}: ${v.filePath}`);
        });
      }
    });

  } catch (error) {
    console.error('Error checking songs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSongs();
