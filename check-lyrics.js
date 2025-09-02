const { PrismaClient } = require('@prisma/client');

async function checkLyrics() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando letras en la base de datos...');
    
    // Verificar todas las letras
    const allLyrics = await prisma.lyric.findMany({
      include: {
        song: {
          select: {
            title: true,
            voiceType: true
          }
        }
      }
    });
    
    console.log(`📝 Total de letras encontradas: ${allLyrics.length}`);
    
    allLyrics.forEach((lyric, index) => {
      console.log(`\n${index + 1}. Letra ID: ${lyric.id}`);
      console.log(`   Canción: ${lyric.song.title} (${lyric.song.voiceType || 'GENERAL'})`);
      console.log(`   Song ID: ${lyric.songId}`);
      console.log(`   Tipo de voz: ${lyric.voiceType || 'GENERAL'}`);
      console.log(`   Es texto: ${lyric.isTextLyrics}`);
      console.log(`   Activa: ${lyric.isActive}`);
      console.log(`   Contenido: ${lyric.content?.substring(0, 50)}...`);
      if (lyric.textContent) {
        console.log(`   Texto completo: ${lyric.textContent.substring(0, 100)}...`);
      }
      console.log(`   Tiempo inicio: ${lyric.startTime}, Tiempo fin: ${lyric.endTime}`);
      console.log(`   Línea: ${lyric.lineNumber}`);
    });
    
    // Buscar específicamente para la canción que estamos probando
    const targetSongId = 'cmf21d0ay0003p931s6kabifc';
    console.log(`\n🎯 Buscando letras para canción ${targetSongId}...`);
    
    const targetLyrics = await prisma.lyric.findMany({
      where: {
        songId: targetSongId
      },
      include: {
        song: {
          select: {
            title: true,
            voiceType: true
          }
        }
      }
    });
    
    console.log(`📝 Letras para canción específica: ${targetLyrics.length}`);
    
    targetLyrics.forEach((lyric, index) => {
      console.log(`\n  ${index + 1}. ${lyric.content} (${lyric.isTextLyrics ? 'TEXTO' : 'SYNC'})`);
      console.log(`     VoiceType: ${lyric.voiceType}, Activa: ${lyric.isActive}`);
      if (lyric.textContent) {
        console.log(`     Texto: ${lyric.textContent.substring(0, 50)}...`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLyrics();
