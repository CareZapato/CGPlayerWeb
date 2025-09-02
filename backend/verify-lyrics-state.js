const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyLyricsCorrection() {
  try {
    console.log('🔍 Verificando el estado actual de las letras...');
    
    // Buscar la canción Blood después de la limpieza
    const bloodSong = await prisma.song.findFirst({
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
    
    if (bloodSong) {
      console.log('📋 Estado actual de la canción Blood:');
      console.log('- ID del padre:', bloodSong.id);
      console.log('- Letras en el padre:', bloodSong.lyrics.length, '(DEBE SER 0)');
      console.log('- Variantes:', bloodSong.childVersions.length);
      
      for (const child of bloodSong.childVersions) {
        console.log(`- ${child.voiceType}: ${child.lyrics.length} letras (DEBE SER 54)`);
      }
      
      // Verificar si está correcto
      const isCorrect = bloodSong.lyrics.length === 0 && 
                       bloodSong.childVersions.every(child => child.lyrics.length === 54);
      
      if (isCorrect) {
        console.log('✅ ¡PERFECTO! La corrección está funcionando');
      } else {
        console.log('❌ Aún hay problemas con las letras');
      }
    }
    
    // Buscar otras canciones para comparar
    console.log('\n📊 Resumen general de letras:');
    const allParentSongs = await prisma.song.findMany({
      where: {
        voiceType: null
      },
      include: {
        lyrics: true,
        childVersions: {
          include: {
            lyrics: true
          }
        }
      }
    });
    
    console.log('Total de canciones padre:', allParentSongs.length);
    
    let problemSongs = 0;
    for (const song of allParentSongs) {
      if (song.lyrics.length > 0) {
        console.log(`⚠️ ${song.title}: Tiene ${song.lyrics.length} letras en el padre (INCORRECTO)`);
        problemSongs++;
      } else {
        console.log(`✅ ${song.title}: Sin letras en el padre (CORRECTO)`);
      }
    }
    
    if (problemSongs === 0) {
      console.log('\n🎉 ¡TODAS LAS CANCIONES ESTÁN CORRECTAS!');
    } else {
      console.log(`\n⚠️ ${problemSongs} canciones tienen letras incorrectas en el padre`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLyricsCorrection();
