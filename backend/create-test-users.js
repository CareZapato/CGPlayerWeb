const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔄 Creando usuarios de prueba...');
    
    // Crear ubicación por defecto si no existe
    let defaultLocation = await prisma.location.findFirst({
      where: { name: 'Ubicación Principal' }
    });
    
    if (!defaultLocation) {
      defaultLocation = await prisma.location.create({
        data: {
          name: 'Ubicación Principal',
          address: 'Dirección Principal',
          type: 'SANTIAGO',
          city: 'Santiago',
          region: 'Metropolitana',
          isActive: true
        }
      });
      console.log('📍 Ubicación por defecto creada:', defaultLocation.name);
    }

    // Hash para password "123456"
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Crear usuarios de prueba
    const testUsers = [
      {
        id: 'cmf2x9hu70006g2wksnbe5lex', // El ID específico del error
        email: 'admin@cgplayer.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Usuario',
        isActive: true,
        locationId: defaultLocation.id
      },
      {
        email: 'soprano@cgplayer.com',
        username: 'soprano',
        password: hashedPassword,
        firstName: 'Soprano',
        lastName: 'Usuario',
        isActive: true,
        locationId: defaultLocation.id
      },
      {
        email: 'contralto@cgplayer.com',
        username: 'contralto',
        password: hashedPassword,
        firstName: 'Contralto',
        lastName: 'Usuario',
        isActive: true,
        locationId: defaultLocation.id
      },
      {
        email: 'tenor@cgplayer.com',
        username: 'tenor',
        password: hashedPassword,
        firstName: 'Tenor',
        lastName: 'Usuario',
        isActive: true,
        locationId: defaultLocation.id
      },
      {
        email: 'bajo@cgplayer.com',
        username: 'bajo',
        password: hashedPassword,
        firstName: 'Bajo',
        lastName: 'Usuario',
        isActive: true,
        locationId: defaultLocation.id
      }
    ];

    for (const userData of testUsers) {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username },
            { id: userData.id }
          ]
        }
      });

      if (!existingUser) {
        const user = await prisma.user.create({
          data: userData
        });
        console.log(`✅ Usuario creado: ${user.username} (${user.email})`);
        
        // Crear perfil de voz por defecto
        if (userData.username !== 'admin') {
          let voiceType = userData.username.toUpperCase();
          // Mapear nombres de usuario a tipos de voz válidos
          if (voiceType === 'ALTO') voiceType = 'CONTRALTO';
          if (voiceType === 'BASS') voiceType = 'BAJO';
          
          await prisma.userVoiceProfile.create({
            data: {
              userId: user.id,
              voiceType: voiceType,
              assignedBy: user.id // Auto-asignado
            }
          });
          console.log(`  🎵 Perfil de voz creado: ${voiceType}`);
        }
      } else {
        console.log(`⚠️ Usuario ya existe: ${userData.username}`);
      }
    }

    // Verificar usuarios creados
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total de usuarios en la base de datos: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
