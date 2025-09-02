const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugLatestUpload() {
  try {
    console.log('🔍 Debugging latest song upload...\n');

    // Buscar la canción más reciente
    const latestSong = await prisma.song.findFirst({
      where: {
        voiceType: null // Song padre
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        children: {
          select: {
            id: true,
            title: true,
            voiceType: true,
            createdAt: true
          }
        }
      }
    });

    if (!latestSong) {
      console.log('❌ No parent songs found');
      return;
    }

    console.log(`📋 Latest uploaded song: ${latestSong.title}`);
    console.log(`   - Parent ID: ${latestSong.id}`);
    console.log(`   - Created: ${latestSong.createdAt}`);
    console.log(`   - Variants count: ${latestSong.children.length}`);

    console.log('\n📊 Variants:');
    latestSong.children.forEach(child => {
      console.log(`   - ${child.voiceType}: ${child.id} (${child.title})`);
    });

    // Buscar todas las letras relacionadas
    const allRelatedSongIds = [latestSong.id, ...latestSong.children.map(c => c.id)];
    
    console.log('\n🔍 Searching for lyrics in all related songs...');
    const allLyrics = await prisma.lyric.findMany({
      where: {
        songId: {
          in: allRelatedSongIds
        }
      },
      select: {
        id: true,
        songId: true,
        voiceType: true,
        content: true,
        isTextLyrics: true,
        lineNumber: true
      },
      orderBy: [
        { songId: 'asc' },
        { voiceType: 'asc' },
        { lineNumber: 'asc' }
      ]
    });

    console.log(`\n📝 Found ${allLyrics.length} total lyrics`);

    // Agrupar por songId
    const lyricsBySong = {};
    allLyrics.forEach(lyric => {
      if (!lyricsBySong[lyric.songId]) {
        lyricsBySong[lyric.songId] = [];
      }
      lyricsBySong[lyric.songId].push(lyric);
    });

    console.log('\n📊 Lyrics distribution:');
    
    // Verificar letras en song padre
    const parentLyrics = lyricsBySong[latestSong.id] || [];
    console.log(`\n🎵 Parent Song (${latestSong.id}):`);
    console.log(`   - Total lyrics: ${parentLyrics.length}`);
    
    if (parentLyrics.length > 0) {
      const voiceTypesInParent = [...new Set(parentLyrics.map(l => l.voiceType))];
      console.log(`   - Voice types found: ${voiceTypesInParent.map(v => v || 'null').join(', ')}`);
      
      // Si hay letras con voiceType diferente a null en el padre, es el problema
      const wrongVoiceTypes = parentLyrics.filter(l => l.voiceType !== null);
      if (wrongVoiceTypes.length > 0) {
        console.log(`   ❌ PROBLEM: ${wrongVoiceTypes.length} lyrics with wrong voiceType in parent song!`);
        const wrongTypes = [...new Set(wrongVoiceTypes.map(l => l.voiceType))];
        console.log(`   🚫 Wrong voiceTypes: ${wrongTypes.join(', ')}`);
      } else {
        console.log(`   ✅ All lyrics in parent have correct voiceType (null)`);
      }
    }

    // Verificar letras en variantes
    for (const variant of latestSong.children) {
      const variantLyrics = lyricsBySong[variant.id] || [];
      console.log(`\n🎤 Variant ${variant.voiceType} (${variant.id}):`);
      console.log(`   - Total lyrics: ${variantLyrics.length}`);
      
      if (variantLyrics.length > 0) {
        const voiceTypesInVariant = [...new Set(variantLyrics.map(l => l.voiceType))];
        console.log(`   - Voice types found: ${voiceTypesInVariant.map(v => v || 'null').join(', ')}`);
        
        // Verificar si las letras tienen el voiceType correcto
        const correctVoiceType = variantLyrics.filter(l => l.voiceType === variant.voiceType);
        const wrongVoiceType = variantLyrics.filter(l => l.voiceType !== variant.voiceType);
        
        if (wrongVoiceType.length > 0) {
          console.log(`   ❌ PROBLEM: ${wrongVoiceType.length} lyrics with wrong voiceType!`);
        } else {
          console.log(`   ✅ All lyrics have correct voiceType`);
        }
      }
    }

    // Buscar letras huérfanas (con songIds que no existen)
    const existingSongIds = allRelatedSongIds;
    const orphanLyrics = await prisma.lyric.findMany({
      where: {
        songId: {
          notIn: existingSongIds
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    if (orphanLyrics.length > 0) {
      console.log(`\n🚨 Found ${orphanLyrics.length} orphan lyrics (pointing to non-existent songs)`);
      orphanLyrics.forEach(lyric => {
        console.log(`   - Lyric ${lyric.id} points to non-existent songId: ${lyric.songId}`);
      });
    }

    console.log('\n✅ Debug completed');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLatestUpload();
