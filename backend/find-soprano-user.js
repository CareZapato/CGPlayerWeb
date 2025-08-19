const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSopranoUser() {
  try {
    // Buscar una usuaria con perfil SOPRANO
    const sopranoUser = await prisma.user.findFirst({
      where: {
        voiceProfiles: {
          some: {
            voiceType: 'SOPRANO'
          }
        },
        roles: {
          some: {
            role: 'CANTANTE'
          }
        }
      },
      include: {
        voiceProfiles: true,
        roles: true,
        location: true
      }
    });

    if (sopranoUser) {
      console.log('🎤 Usuario SOPRANO encontrado:');
      console.log(`📧 Email: ${sopranoUser.email}`);
      console.log(`👤 Nombre: ${sopranoUser.firstName} ${sopranoUser.lastName}`);
      console.log(`🏙️ Ubicación: ${sopranoUser.location?.city || 'Sin ubicación'}`);
      console.log(`🎭 Tipos de voz: ${sopranoUser.voiceProfiles.map(vp => vp.voiceType).join(', ')}`);
      console.log('🔑 Contraseña: cantante123');
    } else {
      console.log('❌ No se encontró ningún usuario SOPRANO');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSopranoUser();
