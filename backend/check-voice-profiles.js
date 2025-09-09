const { PrismaClient } = require('@prisma/client');

async function checkVoiceProfiles() {
  const prisma = new PrismaClient();
  
  try {
    // Contar total de UserVoiceProfile
    const totalVoiceProfiles = await prisma.userVoiceProfile.count();
    console.log('📊 Total UserVoiceProfile records:', totalVoiceProfiles);
    
    // Obtener algunos ejemplos
    const samples = await prisma.userVoiceProfile.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log('🎤 Ejemplos de VoiceProfiles:');
    samples.forEach((vp, index) => {
      console.log(`  ${index + 1}. Usuario: ${vp.user.firstName} ${vp.user.lastName}`);
      console.log(`     Tipo de voz: ${vp.voiceType}`);
      console.log(`     Es primaria: ${vp.isPrimary}`);
    });
    
    // Verificar usuarios con voces primarias
    const usersWithPrimaryVoices = await prisma.user.findMany({
      where: {
        voiceProfiles: {
          some: {
            isPrimary: true
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        voiceProfiles: {
          where: {
            isPrimary: true
          }
        }
      },
      take: 5
    });
    
    console.log('👥 Usuarios con voces primarias:');
    usersWithPrimaryVoices.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName}`);
      user.voiceProfiles.forEach(vp => {
        console.log(`     - ${vp.voiceType} (primaria)`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVoiceProfiles();
