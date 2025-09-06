const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureTestUser() {
  try {
    console.log('🔍 Verificando/creando usuario de prueba BAJO...');

    // Verificar si existe el usuario
    let testUser = await prisma.user.findFirst({
      where: { email: 'test.bajo@cgplayer.com' }
    });

    if (testUser) {
      console.log('✅ Usuario de prueba ya existe');
    } else {
      console.log('🔨 Creando usuario de prueba...');
      
      // Crear usuario
      testUser = await prisma.user.create({
        data: {
          email: 'test.bajo@cgplayer.com',
          username: 'test.bajo',
          firstName: 'Test',
          lastName: 'Bajo',
          password: await bcrypt.hash('cantante123', 12),
          isActive: true,
          locationId: '1' // Usar la primera ubicación disponible
        }
      });

      console.log('✅ Usuario creado');
    }

    // Verificar rol CANTANTE
    const cantanteRole = await prisma.userRole_DB.findFirst({
      where: {
        userId: testUser.id,
        role: 'CANTANTE'
      }
    });

    if (!cantanteRole) {
      await prisma.userRole_DB.create({
        data: {
          userId: testUser.id,
          role: 'CANTANTE'
        }
      });
      console.log('✅ Rol CANTANTE agregado');
    }

    // Verificar voice type BAJO
    const voiceProfile = await prisma.userVoiceProfile.findFirst({
      where: {
        userId: testUser.id,
        voiceType: 'BAJO'
      }
    });

    if (!voiceProfile) {
      await prisma.userVoiceProfile.create({
        data: {
          userId: testUser.id,
          voiceType: 'BAJO',
          isActive: true,
          isPrimary: true
        }
      });
      console.log('✅ Voice type BAJO agregado');
    }

    console.log('\n🎯 USUARIO DE PRUEBA LISTO:');
    console.log('   📧 Email: test.bajo@cgplayer.com');
    console.log('   🔑 Password: cantante123');
    console.log('   🎭 Role: CANTANTE');
    console.log('   🎤 Voice Type: BAJO');
    console.log('   ✅ Estado: Activo');
    console.log('');
    console.log('🔬 PRUEBA MANUAL:');
    console.log('1. Ir a http://192.168.1.10:5173/login');
    console.log('2. Login con test.bajo@cgplayer.com / cantante123');
    console.log('3. Ir a /songs - debería ver solo 2 canciones');
    console.log('4. Cada canción debería mostrar solo 1 variación (ORIGINAL)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureTestUser();
