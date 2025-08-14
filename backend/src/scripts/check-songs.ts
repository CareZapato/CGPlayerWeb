import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSongs() {
  try {
    console.log('🔍 Verificando canciones en la base de datos...');
    
    const songs = await prisma.song.findMany({
      include: {
        parentSong: true,
        childVersions: true,
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Total de canciones: ${songs.length}\n`);
    
    songs.forEach((song: any, index: number) => {
      console.log(`${index + 1}. 🎵 "${song.title}"`);
      console.log(`   📝 ID: ${song.id}`);
      console.log(`   🎤 Voz: ${song.voiceType || 'Sin especificar'}`);
      console.log(`   👨‍👩‍👧‍👦 Padre: ${song.parentSongId ? (song.parentSong?.title || 'ID no encontrado') : 'ES CONTENEDOR'}`);
      console.log(`   👶 Hijos: ${song.childVersions.length} variaciones`);
      console.log(`   📁 Archivo: ${song.fileName || 'Sin archivo'}`);
      console.log(`   👤 Subido por: ${song.uploader?.firstName || 'N/A'} ${song.uploader?.lastName || ''}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSongs();
