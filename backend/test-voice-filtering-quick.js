const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickTest() {
  try {
    console.log('🎵 === PRUEBA RÁPIDA: FILTRADO DE VOICE TYPES ===\n');

    // 1. Verificar usuario de prueba BAJO
    const bajoUser = await prisma.user.findFirst({
      where: {
        email: 'test.bajo@cgplayer.com'
      },
      include: {
        roles: {
          select: { role: true }
        },
        voiceProfiles: {
          select: { voiceType: true }
        }
      }
    });

    if (!bajoUser) {
      console.log('❌ Usuario BAJO no encontrado');
      return;
    }

    console.log('👤 Usuario de prueba encontrado:');
    console.log(`   Email: ${bajoUser.email}`);
    console.log(`   Roles: ${bajoUser.roles.map(r => r.role).join(', ')}`);
    console.log(`   Voice Types: ${bajoUser.voiceProfiles.map(vp => vp.voiceType).join(', ')}`);

    // 2. Obtener canciones principales con sus variaciones
    const parentSongs = await prisma.song.findMany({
      where: {
        isActive: true,
        parentSongId: null  // Solo canciones principales
      },
      include: {
        childVersions: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            voiceType: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    console.log('\n📊 ANÁLISIS DE FILTRADO:');
    console.log('========================');

    const userVoiceTypes = ['BAJO'];
    const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];

    console.log(`🎤 Voice types permitidos para BAJO: ${allowedVoiceTypes.join(', ')}`);

    let songsUserCanSee = 0;
    let totalVariationsUserCanAccess = 0;

    parentSongs.forEach((song, index) => {
      // Filtrar variaciones que el usuario puede ver
      const accessibleVariations = song.childVersions.filter(variation => {
        if (!variation.voiceType) return true; // Sin voice type = ORIGINAL
        return allowedVoiceTypes.includes(variation.voiceType);
      });

      if (accessibleVariations.length > 0) {
        songsUserCanSee++;
        totalVariationsUserCanAccess += accessibleVariations.length;
        
        console.log(`\n✅ "${song.title}"`);
        console.log(`   Variaciones accesibles: ${accessibleVariations.length}/${song.childVersions.length}`);
        accessibleVariations.forEach(v => {
          console.log(`      - ${v.voiceType || 'sin voice type'}`);
        });
      } else {
        console.log(`\n❌ "${song.title}"`);
        console.log(`   Sin variaciones accesibles (${song.childVersions.length} total)`);
      }
    });

    console.log('\n📈 RESULTADO FINAL:');
    console.log('==================');
    console.log(`📋 Total canciones principales: ${parentSongs.length}`);
    console.log(`✅ Canciones que usuario BAJO debería ver: ${songsUserCanSee}`);
    console.log(`🎵 Total variaciones accesibles: ${totalVariationsUserCanAccess}`);
    console.log('');
    console.log('🔍 VALIDACIÓN:');
    console.log(`   - En /songs página debería mostrar: ${songsUserCanSee} canciones`);
    console.log(`   - Cada canción debería mostrar solo sus variaciones accesibles`);
    console.log(`   - En eventos/playlists solo debería recibir canciones BAJO/CORO/ORIGINAL`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
