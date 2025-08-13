import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting basic seeding (without songs)...');

  // Limpiar datos existentes (en orden correcto debido a relaciones)
  console.log('🧹 Cleaning existing data...');
  await prisma.soloist.deleteMany();
  await prisma.eventSong.deleteMany();
  await prisma.event.deleteMany();
  await prisma.lyric.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.songAssignment.deleteMany();
  await prisma.song.deleteMany();
  await prisma.userVoiceProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  // 1. Crear ubicaciones
  console.log('📍 Creating locations...');
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Iglesia Central Antofagasta',
        type: 'ANTOFAGASTA',
        address: 'Av. Pedro Aguirre Cerda 150',
        city: 'Antofagasta',
        region: 'Antofagasta',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia ChileGospel Viña del Mar',
        type: 'VINA_DEL_MAR',
        address: 'Calle Libertad 456',
        city: 'Viña del Mar',
        region: 'Valparaíso',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia Principal Santiago',
        type: 'SANTIAGO',
        address: 'Av. Providencia 2500',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia ChileGospel Concepción',
        type: 'CONCEPCION',
        address: 'Calle Barros Arana 100',
        city: 'Concepción',
        region: 'Biobío',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia ChileGospel Valdivia',
        type: 'VALDIVIA',
        address: 'Av. Picarte 800',
        city: 'Valdivia',
        region: 'Los Ríos',
        country: 'Chile'
      }
    })
  ]);

  console.log(`✅ Created ${locations.length} locations`);

  // 2. Crear usuarios con ubicaciones asignadas
  console.log('👥 Creating users...');
  
  // Administrador
  const admin = await prisma.user.create({
    data: {
      email: 'admin@chilegospel.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Carlos',
      lastName: 'Administrador',
      role: 'ADMIN',
      locationId: locations[2].id // Santiago
    }
  });

  // Director Musical
  const director = await prisma.user.create({
    data: {
      email: 'director@chilegospel.com',
      username: 'director',
      password: await bcrypt.hash('director123', 10),
      firstName: 'María',
      lastName: 'Directora',
      role: 'DIRECTOR',
      locationId: locations[2].id // Santiago
    }
  });

  // Cantantes por ubicación
  const singers: any[] = [];
  const voiceTypes = ['SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONE', 'BASS'];
  const names = [
    { first: 'Ana', last: 'González' },
    { first: 'Luis', last: 'Martínez' },
    { first: 'Carmen', last: 'López' },
    { first: 'Pedro', last: 'Silva' },
    { first: 'Isabel', last: 'Torres' },
    { first: 'Miguel', last: 'Flores' },
    { first: 'Rosa', last: 'Hernández' },
    { first: 'Juan', last: 'Morales' },
    { first: 'Patricia', last: 'Vargas' },
    { first: 'Roberto', last: 'Castro' }
  ];

  for (let i = 0; i < 10; i++) {
    const locationIndex = i % locations.length;
    const voiceIndex = i % voiceTypes.length;
    
    const singer = await prisma.user.create({
      data: {
        email: `singer${i + 1}@chilegospel.com`,
        username: `singer${i + 1}`,
        password: await bcrypt.hash('singer123', 10),
        firstName: names[i].first,
        lastName: names[i].last,
        role: 'SINGER',
        locationId: locations[locationIndex].id
      }
    });

    // Crear perfil de voz
    await prisma.userVoiceProfile.create({
      data: {
        userId: singer.id,
        voiceType: voiceTypes[voiceIndex] as any,
        assignedBy: director.id
      }
    });

    singers.push(singer);
  }

  console.log(`✅ Created ${singers.length} singers + admin + director`);

  // 3. Crear algunos eventos básicos (sin canciones)
  console.log('📅 Creating basic events...');
  
  const eventCategories = ['Culto', 'Ensayo', 'Presentación', 'Especial'];
  const events = [];

  for (let i = 0; i < 4; i++) {
    const locationIndex = i % locations.length;
    const categoryIndex = i % eventCategories.length;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + ((i + 1) * 7)); // Eventos semanales

    const event = await prisma.event.create({
      data: {
        title: `${eventCategories[categoryIndex]} - ${locations[locationIndex].name}`,
        description: `${eventCategories[categoryIndex]} programado en ${locations[locationIndex].city}`,
        date: futureDate,
        locationId: locations[locationIndex].id,
        category: eventCategories[categoryIndex]
      }
    });

    events.push(event);
  }

  console.log(`✅ Created ${events.length} events (without songs)`);

  // Mostrar resumen
  console.log('\n🎉 Basic seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👥 Users: ${singers.length + 2} (1 admin, 1 director, ${singers.length} singers)`);
  console.log(`📍 Locations: ${locations.length}`);
  console.log(`📅 Events: ${events.length} (without songs - ready for testing)`);
  
  console.log('\n🔑 Login credentials:');
  console.log('Admin: admin@chilegospel.com / admin123');
  console.log('Director: director@chilegospel.com / director123');
  console.log('Singers: singer1@chilegospel.com / singer123 (etc.)');
  
  console.log('\n🌍 Locations created:');
  locations.forEach(loc => {
    console.log(`- ${loc.name} (${loc.city})`);
  });

  console.log('\n📝 Next steps:');
  console.log('- Use the upload functionality to add songs');
  console.log('- Test the multi-upload feature');
  console.log('- Assign songs to events');
  console.log('- Configure soloists for events');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
