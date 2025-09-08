const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyPrimaryVoices() {
  try {
    console.log('🔍 Verificando y actualizando voces primarias...\n');

    // Obtener todos los usuarios con múltiples voces que no tengan voz primaria
    const usersWithoutPrimary = await prisma.user.findMany({
      where: {
        voiceProfiles: {
          some: {},
          none: {
            isPrimary: true
          }
        }
      },
      include: {
        voiceProfiles: true
      }
    });

    console.log(`✅ Encontrados ${usersWithoutPrimary.length} usuarios sin voz primaria definida`);

    for (const user of usersWithoutPrimary) {
      if (user.voiceProfiles.length > 0) {
        // Hacer que la primera voz sea primaria
        const firstVoice = user.voiceProfiles[0];
        await prisma.userVoiceProfile.update({
          where: { id: firstVoice.id },
          data: { isPrimary: true }
        });
        
        console.log(`✅ ${user.firstName} ${user.lastName} - Voz primaria establecida: ${firstVoice.voiceType}`);
      }
    }

    // Obtener estadísticas finales
    const totalUsers = await prisma.user.count({
      where: {
        roles: {
          some: { role: 'CANTANTE' }
        }
      }
    });

    const usersWithPrimary = await prisma.user.count({
      where: {
        voiceProfiles: {
          some: {
            isPrimary: true
          }
        }
      }
    });

    const voiceStats = await prisma.userVoiceProfile.groupBy({
      by: ['voiceType', 'isPrimary'],
      _count: {
        voiceType: true
      },
      orderBy: {
        voiceType: 'asc'
      }
    });

    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log(`👥 Total cantantes: ${totalUsers}`);
    console.log(`⭐ Cantantes con voz primaria: ${usersWithPrimary}`);
    console.log('\n🎵 Distribución de voces:');
    
    const voicesByType = {};
    voiceStats.forEach(stat => {
      if (!voicesByType[stat.voiceType]) {
        voicesByType[stat.voiceType] = { total: 0, primary: 0 };
      }
      voicesByType[stat.voiceType].total += stat._count.voiceType;
      if (stat.isPrimary) {
        voicesByType[stat.voiceType].primary = stat._count.voiceType;
      }
    });

    Object.entries(voicesByType).forEach(([voice, counts]) => {
      console.log(`   ${voice}: ${counts.total} total (${counts.primary} primarias)`);
    });

    console.log('\n🎉 Verificación completada exitosamente!');
    
    console.log('\n🔑 RECORDATORIO - CREDENCIALES DE ACCESO:');
    console.log('═══════════════════════════════════════════');
    console.log('👤 ADMINISTRADOR:');
    console.log('📧 Email: admin@cgplayer.com');
    console.log('👤 Username: admin');
    console.log('🔒 Password: admin123');
    console.log('───────────────────────────────────────────');
    console.log('🎤 CANTANTES (ejemplos):');
    console.log('📧 Email: maria.gonzalez@cgplayer.com');
    console.log('👤 Username: maria1');
    console.log('🔒 Password: cantante123');
    console.log('───────────────────────────────────────────');
    console.log('🎤 CANTANTES DE PRUEBA:');
    console.log('📧 Email: test.soprano@cgplayer.com');
    console.log('👤 Username: test.soprano');
    console.log('🔒 Password: test123');
    console.log('═══════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error verificando voces primarias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPrimaryVoices();
