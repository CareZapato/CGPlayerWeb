const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Iniciando seed definitivo para CGPlayerWeb...');

    // 1. Crear ubicaciones
    console.log('📍 Creando ubicaciones...');
    const locations = await Promise.all([
      prisma.location.upsert({
        where: { name: 'Santiago Centro' },
        update: {},
        create: {
          name: 'Santiago Centro',
          address: 'Santiago, Región Metropolitana, Chile'
        }
      }),
      prisma.location.upsert({
        where: { name: 'Providencia' },
        update: {},
        create: {
          name: 'Providencia',
          address: 'Providencia, Región Metropolitana, Chile'
        }
      }),
      prisma.location.upsert({
        where: { name: 'Las Condes' },
        update: {},
        create: {
          name: 'Las Condes',
          address: 'Las Condes, Región Metropolitana, Chile'
        }
      })
    ]);

    // 2. Crear roles
    console.log('👥 Creando roles de usuario...');
    const roles = await Promise.all([
      prisma.userRole_DB.upsert({
        where: { roleName: 'admin' },
        update: {},
        create: { roleName: 'admin' }
      }),
      prisma.userRole_DB.upsert({
        where: { roleName: 'leader' },
        update: {},
        create: { roleName: 'leader' }
      }),
      prisma.userRole_DB.upsert({
        where: { roleName: 'member' },
        update: {},
        create: { roleName: 'member' }
      })
    ]);

    // 3. Crear tipos de voz
    console.log('🎵 Creando tipos de voz...');
    const voiceTypes = await Promise.all([
      'SOPRANO',
      'MESOSOPRANO',
      'CONTRALTO',
      'TENOR',
      'BARITONO',
      'BAJO',
      'INSTRUMENTAL'
    ].map(voiceType =>
      prisma.voiceType.upsert({
        where: { name: voiceType },
        update: {},
        create: { 
          name: voiceType,
          description: `Tipo de voz ${voiceType.toLowerCase()}`
        }
      })
    ));

    // 4. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('cgplayer2025', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@cgplayer.local' },
      update: {},
      create: {
        email: 'admin@cgplayer.local',
        firstName: 'Admin',
        lastName: 'CGPlayer',
        password: hashedPassword,
        isActive: true,
        locationId: locations[0].id,
        userRoleId: roles[0].id
      }
    });

    // 5. Crear algunos cantantes de ejemplo
    console.log('🎤 Creando cantantes de ejemplo...');
    const singers = [
      { firstName: 'María', lastName: 'González', email: 'maria@cgplayer.local', voice: 'SOPRANO' },
      { firstName: 'Ana', lastName: 'Martínez', email: 'ana@cgplayer.local', voice: 'MESOSOPRANO' },
      { firstName: 'Carlos', lastName: 'López', email: 'carlos@cgplayer.local', voice: 'TENOR' },
      { firstName: 'Pedro', lastName: 'Rodríguez', email: 'pedro@cgplayer.local', voice: 'BAJO' }
    ];

    for (const singer of singers) {
      const hashedSingerPassword = await bcrypt.hash('singer123', 12);
      const voiceType = voiceTypes.find(v => v.name === singer.voice);
      
      const user = await prisma.user.upsert({
        where: { email: singer.email },
        update: {},
        create: {
          email: singer.email,
          firstName: singer.firstName,
          lastName: singer.lastName,
          password: hashedSingerPassword,
          isActive: true,
          locationId: locations[Math.floor(Math.random() * locations.length)].id,
          userRoleId: roles[2].id // member role
        }
      });

      // Asignar tipo de voz
      await prisma.userVoiceProfile.upsert({
        where: {
          userId_voiceTypeId: {
            userId: user.id,
            voiceTypeId: voiceType.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          voiceTypeId: voiceType.id,
          isPrimary: true
        }
      });
    }

    // 6. Crear categorías de canciones
    console.log('📚 Creando categorías...');
    const categories = await Promise.all([
      'Himnos Tradicionales',
      'Música Contemporánea',
      'Gospel',
      'Villancicos',
      'Música Litúrgica',
      'Coros Especiales'
    ].map(categoryName =>
      prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          description: `Categoría de ${categoryName}`
        }
      })
    ));

    // 7. Crear algunas canciones de ejemplo
    console.log('🎼 Creando canciones de ejemplo...');
    const songs = [
      {
        title: 'Amazing Grace',
        artist: 'John Newton',
        categoryName: 'Himnos Tradicionales',
        duration: 240
      },
      {
        title: 'How Great Thou Art',
        artist: 'Carl Boberg',
        categoryName: 'Himnos Tradicionales',
        duration: 300
      },
      {
        title: 'Cornerstone',
        artist: 'Hillsong',
        categoryName: 'Música Contemporánea',
        duration: 360
      }
    ];

    for (const song of songs) {
      const category = categories.find(c => c.name === song.categoryName);
      await prisma.song.upsert({
        where: { title: song.title },
        update: {},
        create: {
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          categoryId: category.id,
          isActive: true
        }
      });
    }

    // 8. Crear noticia de bienvenida
    console.log('📰 Creando noticia de bienvenida...');
    await prisma.news.upsert({
      where: { title: 'Bienvenido a CGPlayerWeb' },
      update: {},
      create: {
        title: 'Bienvenido a CGPlayerWeb',
        content: 'CGPlayerWeb está listo para gestionar tu coro. Puedes comenzar agregando canciones, organizando eventos y gestionando a los miembros de tu coro.',
        authorId: adminUser.id,
        isPublished: true
      }
    });

    console.log('✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- Ubicaciones: ${locations.length}`);
    console.log(`- Roles: ${roles.length}`);
    console.log(`- Tipos de voz: ${voiceTypes.length}`);
    console.log(`- Usuarios: ${singers.length + 1} (incluyendo admin)`);
    console.log(`- Categorías: ${categories.length}`);
    console.log(`- Canciones: ${songs.length}`);
    console.log('\n🔐 Credenciales de administrador:');
    console.log('Email: admin@cgplayer.local');
    console.log('Password: cgplayer2025');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = main;
