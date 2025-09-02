const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanIncorrectLyrics() {
  try {
    console.log('🧹 Cleaning incorrect lyrics...\n');

    // 1. Encontrar la song "God will take care of you" (padre)
    const parentSong = await prisma.song.findFirst({
      where: {
        title: {
          startsWith: 'God will take care of you'
        },
        voiceType: null
      }
    });

    if (!parentSong) {
      console.log('❌ Parent song not found');
      return;
    }

    console.log(`📋 Found parent song: ${parentSong.title} (${parentSong.id})`);

    // 2. Encontrar todas las variantes que realmente existen
    const variants = await prisma.song.findMany({
      where: {
        parentSongId: parentSong.id
      },
      select: {
        id: true,
        title: true,
        voiceType: true
      }
    });

    const existingVoiceTypes = [null, ...variants.map(v => v.voiceType)];
    console.log(`📊 Existing voice types: ${existingVoiceTypes.join(', ')}`);

    // 3. Eliminar TODAS las letras que apuntan al song padre pero tienen voiceTypes que no corresponden
    console.log('\n🗑️ Deleting incorrect lyrics...');
    
    // Obtener todas las letras que apuntan al song padre
    const allLyrics = await prisma.lyric.findMany({
      where: {
        songId: parentSong.id
      },
      select: {
        id: true,
        voiceType: true,
        content: true,
        songId: true
      }
    });

    console.log(`📊 Found ${allLyrics.length} lyrics pointing to parent song`);

    // Separar letras correctas e incorrectas
    const correctLyrics = allLyrics.filter(lyric => lyric.voiceType === null);
    const incorrectLyrics = allLyrics.filter(lyric => lyric.voiceType !== null);

    console.log(`✅ Correct lyrics (voiceType null): ${correctLyrics.length}`);
    console.log(`❌ Incorrect lyrics (voiceType not null): ${incorrectLyrics.length}`);

    if (incorrectLyrics.length > 0) {
      const incorrectLyricsIds = incorrectLyrics.map(l => l.id);
      
      console.log('\n🗑️ Deleting incorrect lyrics...');
      const deleteResult = await prisma.lyric.deleteMany({
        where: {
          id: {
            in: incorrectLyricsIds
          }
        }
      });

      console.log(`✅ Deleted ${deleteResult.count} incorrect lyrics`);

      // Mostrar cuáles voiceTypes tenían letras incorrectas
      const incorrectVoiceTypes = [...new Set(incorrectLyrics.map(l => l.voiceType))];
      console.log(`🔍 VoiceTypes that had incorrect lyrics: ${incorrectVoiceTypes.join(', ')}`);
    }

    // 4. Verificar que ahora solo quedan letras con voiceType null en el song padre
    const remainingLyrics = await prisma.lyric.findMany({
      where: {
        songId: parentSong.id
      },
      select: {
        id: true,
        voiceType: true,
        songId: true
      }
    });

    console.log(`\n📊 Remaining lyrics in parent song: ${remainingLyrics.length}`);
    const remainingVoiceTypes = [...new Set(remainingLyrics.map(l => l.voiceType))];
    console.log(`🎯 Remaining voiceTypes: ${remainingVoiceTypes.join(', ')}`);

    // 5. Verificar letras en las variantes
    console.log('\n📋 Checking lyrics in variants...');
    for (const variant of variants) {
      const variantLyrics = await prisma.lyric.findMany({
        where: {
          songId: variant.id
        }
      });
      console.log(`  - ${variant.voiceType}: ${variantLyrics.length} lyrics`);
    }

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanIncorrectLyrics();
