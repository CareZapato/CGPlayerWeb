const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Configuración para tipos de voz por género
const voiceTypesByGender = {
  female: ['SOPRANO', 'MESOSOPRANO', 'CONTRALTO'],
  male: ['TENOR', 'BARITONO', 'BAJO']
};

// Datos de ejemplo para cantantes
const singersData = [
  // Mujeres
  { firstName: 'María', lastName: 'González', email: 'maria.gonzalez@cgplayer.com', username: 'maria.gonzalez', gender: 'female', locationIndex: 0 },
  { firstName: 'Ana', lastName: 'López', email: 'ana.lopez@cgplayer.com', username: 'ana.lopez', gender: 'female', locationIndex: 1 },
  { firstName: 'Carmen', lastName: 'Rodríguez', email: 'carmen.rodriguez@cgplayer.com', username: 'carmen.rodriguez', gender: 'female', locationIndex: 0 },
  { firstName: 'Isabel', lastName: 'Martínez', email: 'isabel.martinez@cgplayer.com', username: 'isabel.martinez', gender: 'female', locationIndex: 1 },
  { firstName: 'Laura', lastName: 'Sánchez', email: 'laura.sanchez@cgplayer.com', username: 'laura.sanchez', gender: 'female', locationIndex: 2 },
  { firstName: 'Patricia', lastName: 'Gómez', email: 'patricia.gomez@cgplayer.com', username: 'patricia.gomez', gender: 'female', locationIndex: 0 },
  { firstName: 'Rosa', lastName: 'Fernández', email: 'rosa.fernandez@cgplayer.com', username: 'rosa.fernandez', gender: 'female', locationIndex: 1 },
  { firstName: 'Elena', lastName: 'Ruiz', email: 'elena.ruiz@cgplayer.com', username: 'elena.ruiz', gender: 'female', locationIndex: 2 },
  { firstName: 'Lucía', lastName: 'Díaz', email: 'lucia.diaz@cgplayer.com', username: 'lucia.diaz', gender: 'female', locationIndex: 0 },
  { firstName: 'Marta', lastName: 'Moreno', email: 'marta.moreno@cgplayer.com', username: 'marta.moreno', gender: 'female', locationIndex: 1 },
  
  // Hombres
  { firstName: 'Carlos', lastName: 'Martín', email: 'carlos.martin@cgplayer.com', username: 'carlos.martin', gender: 'male', locationIndex: 0 },
  { firstName: 'José', lastName: 'García', email: 'jose.garcia@cgplayer.com', username: 'jose.garcia', gender: 'male', locationIndex: 1 },
  { firstName: 'Antonio', lastName: 'Hernández', email: 'antonio.hernandez@cgplayer.com', username: 'antonio.hernandez', gender: 'male', locationIndex: 2 },
  { firstName: 'Manuel', lastName: 'Jiménez', email: 'manuel.jimenez@cgplayer.com', username: 'manuel.jimenez', gender: 'male', locationIndex: 0 },
  { firstName: 'Francisco', lastName: 'Álvarez', email: 'francisco.alvarez@cgplayer.com', username: 'francisco.alvarez', gender: 'male', locationIndex: 1 },
  { firstName: 'David', lastName: 'Romero', email: 'david.romero@cgplayer.com', username: 'david.romero', gender: 'male', locationIndex: 2 },
  { firstName: 'Javier', lastName: 'Torres', email: 'javier.torres@cgplayer.com', username: 'javier.torres', gender: 'male', locationIndex: 0 },
  { firstName: 'Rafael', lastName: 'Ramírez', email: 'rafael.ramirez@cgplayer.com', username: 'rafael.ramirez', gender: 'male', locationIndex: 1 },
  { firstName: 'Miguel', lastName: 'Flores', email: 'miguel.flores@cgplayer.com', username: 'miguel.flores', gender: 'male', locationIndex: 2 },
  { firstName: 'Ángel', lastName: 'Herrera', email: 'angel.herrera@cgplayer.com', username: 'angel.herrera', gender: 'male', locationIndex: 0 },
];

// Función para seleccionar voces aleatorias con coherencia de género
function getVoicesForSinger(gender) {
  const availableVoices = voiceTypesByGender[gender];
  const numVoices = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 1; // 30% tienen múltiples voces
  
  const selectedVoices = [];
  const shuffled = [...availableVoices].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(numVoices, availableVoices.length); i++) {
    selectedVoices.push(shuffled[i]);
  }
  
  return selectedVoices;
}

async function main() {
  console.log('🌱 Iniciando seed completo con sistema de voz primaria...');

  // Limpiar datos existentes
  await prisma.userVoiceProfile.deleteMany({});
  await prisma.userRole_DB.deleteMany({});
  await prisma.eventAttendee.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.location.deleteMany({});

  console.log('🗑️  Datos anteriores limpiados');

  // Crear ubicaciones
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Catedral Santiago',
        type: 'SANTIAGO',
        address: 'Plaza de Armas, Santiago',
        city: 'Santiago',
        country: 'Chile',
        color: '#3B82F6',
        phone: '+56-2-2696-2777',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia Valparaíso',
        type: 'CONCEPCION',
        address: 'Cerro Alegre, Valparaíso',
        city: 'Valparaíso',
        country: 'Chile',
        color: '#10B981',
        phone: '+56-32-225-5544',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Templo Viña del Mar',
        type: 'VINA_DEL_MAR',
        address: 'Av. Marina 789',
        city: 'Viña del Mar',
        country: 'Chile',
        color: '#F59E0B',
        phone: '+56-32-268-3311',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Ubicaciones creadas:', locations.map(l => l.name).join(', '));

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cgplayer.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Principal',
      isActive: true,
      locationId: locations[0].id,
    },
  });

  // Asignar rol ADMIN al administrador
  await prisma.userRole_DB.create({
    data: {
      userId: admin.id,
      role: 'ADMIN',
      assignedBy: admin.id,
    },
  });

  console.log('✅ Usuario administrador creado:', admin.firstName);

  // Crear directores
  const director1 = await prisma.user.create({
    data: {
      email: 'director1@cgplayer.com',
      username: 'director.musical',
      password: hashedPassword,
      firstName: 'Roberto',
      lastName: 'Maestro',
      isActive: true,
      locationId: locations[0].id,
    },
  });

  const director2 = await prisma.user.create({
    data: {
      email: 'director2@cgplayer.com',
      username: 'director.coro',
      password: hashedPassword,
      firstName: 'Andrea',
      lastName: 'Directora',
      isActive: true,
      locationId: locations[1].id,
    },
  });

  // Asignar roles a directores
  await prisma.userRole_DB.createMany({
    data: [
      { userId: director1.id, role: 'DIRECTOR', assignedBy: admin.id },
      { userId: director2.id, role: 'DIRECTOR', assignedBy: admin.id },
    ],
  });

  // Asignar voces a directores (pueden tener hasta 2 voces)
  const director1Voices = getVoicesForSinger('male').slice(0, 2);
  const director2Voices = getVoicesForSinger('female').slice(0, 2);

  // Crear perfiles de voz para director1
  for (let i = 0; i < director1Voices.length; i++) {
    await prisma.userVoiceProfile.create({
      data: {
        userId: director1.id,
        voiceType: director1Voices[i],
        isPrimary: i === 0, // La primera es la primaria
        assignedBy: admin.id,
      },
    });
  }

  // Crear perfiles de voz para director2
  for (let i = 0; i < director2Voices.length; i++) {
    await prisma.userVoiceProfile.create({
      data: {
        userId: director2.id,
        voiceType: director2Voices[i],
        isPrimary: i === 0, // La primera es la primaria
        assignedBy: admin.id,
      },
    });
  }

  console.log('✅ Directores creados con voces asignadas');

  // Crear cantantes con sistema de voz primaria
  const singers = [];
  
  for (const singerData of singersData) {
    const singer = await prisma.user.create({
      data: {
        email: singerData.email,
        username: singerData.username,
        password: hashedPassword,
        firstName: singerData.firstName,
        lastName: singerData.lastName,
        isActive: true,
        locationId: locations[singerData.locationIndex].id,
      },
    });

    // Asignar rol CANTANTE
    await prisma.userRole_DB.create({
      data: {
        userId: singer.id,
        role: 'CANTANTE',
        assignedBy: admin.id,
      },
    });

    // Obtener voces para este cantante
    const voices = getVoicesForSinger(singerData.gender);
    
    // Crear perfiles de voz
    for (let i = 0; i < voices.length; i++) {
      await prisma.userVoiceProfile.create({
        data: {
          userId: singer.id,
          voiceType: voices[i],
          isPrimary: i === 0, // La primera voz es la primaria
          assignedBy: admin.id,
        },
      });
    }

    singers.push(singer);
    console.log(`✅ Cantante creado: ${singer.firstName} ${singer.lastName} - Voces: ${voices.join(', ')} (Primaria: ${voices[0]})`);
  }

  console.log(`✅ Total de ${singers.length} cantantes creados con sistema de voz primaria`);

  // Crear algunos eventos de prueba
  const event1 = await prisma.event.create({
    data: {
      title: 'Concierto de Navidad 2024',
      description: 'Celebración especial de temporada navideña con participación de todos los coros',
      date: new Date('2024-12-25T19:00:00Z'),
      time: '19:00',
      category: 'Concierto',
      country: 'Chile',
      isPublic: true,
      allowExternalJoin: true,
      createdBy: admin.id,
      locationId: locations[0].id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Ensayo General - Semana Santa',
      description: 'Preparación para las celebraciones de Semana Santa',
      date: new Date('2025-04-10T18:00:00Z'),
      time: '18:00',
      category: 'Ensayo',
      country: 'Chile',
      isPublic: false,
      allowExternalJoin: false,
      createdBy: director1.id,
      locationId: locations[1].id,
    },
  });

  console.log('✅ Eventos creados:', event1.title, event2.title);

  // Agregar algunos asistentes a los eventos con diferentes estados
  const selectedSingers = singers.slice(0, 10); // Primeros 10 cantantes
  
  for (let i = 0; i < selectedSingers.length; i++) {
    const singer = selectedSingers[i];
        const statuses = ['CONFIRMED', 'CANCELLED', 'NO_SHOW'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];    await prisma.eventAttendee.create({
      data: {
        eventId: event1.id,
        userId: singer.id,
        addedBy: admin.id,
        status: randomStatus,
        attendanceConfirmed: randomStatus === 'CONFIRMED' ? true : null,
        nonAttendanceComment: randomStatus === 'CANCELLED' ? 'Conflicto de horarios' : null,
      },
    });
  }

  // Crear algunas solicitudes de unión para el evento público
  const joinRequests = singers.slice(10, 15); // Siguientes 5 cantantes
  
  for (const singer of joinRequests) {
    await prisma.eventJoinRequest.create({
      data: {
        eventId: event1.id,
        userId: singer.id,
        message: `Me gustaría participar en este evento. Mi voz principal es ${await getPrimaryVoice(singer.id)}.`,
        status: Math.random() > 0.5 ? 'PENDING' : 'APPROVED',
      },
    });
  }

  console.log('✅ Asistentes y solicitudes de unión creadas para los eventos');

  // Estadísticas finales
  const voiceStats = await prisma.userVoiceProfile.groupBy({
    by: ['voiceType'],
    _count: { voiceType: true },
  });

  const primaryVoiceStats = await prisma.userVoiceProfile.groupBy({
    by: ['voiceType'],
    where: { isPrimary: true },
    _count: { voiceType: true },
  });

  console.log('\n📊 Estadísticas de voces:');
  console.log('Total de asignaciones de voz:', voiceStats);
  console.log('Voces primarias:', primaryVoiceStats);

  const multipleVoicesCount = await prisma.user.findMany({
    where: {
      voiceProfiles: {
        some: {}
      }
    },
    include: {
      voiceProfiles: true
    }
  });

  const usersWithMultipleVoices = multipleVoicesCount.filter(user => user.voiceProfiles.length > 1);
  console.log(`👥 Usuarios con múltiples voces: ${usersWithMultipleVoices.length} (${((usersWithMultipleVoices.length / singers.length) * 100).toFixed(1)}%)`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log(`✅ Creados: ${locations.length} ubicaciones, 1 admin, 2 directores, ${singers.length} cantantes, 2 eventos`);
}

// Función auxiliar para obtener la voz primaria de un usuario
async function getPrimaryVoice(userId) {
  const primaryVoice = await prisma.userVoiceProfile.findFirst({
    where: {
      userId: userId,
      isPrimary: true,
    },
  });
  
  return primaryVoice ? primaryVoice.voiceType : 'No definida';
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
