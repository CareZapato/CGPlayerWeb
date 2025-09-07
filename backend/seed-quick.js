const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed básico...');

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cgplayer.com' },
    update: {},
    create: {
      email: 'admin@cgplayer.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      isActive: true,
    },
  });

  console.log('✅ Usuario admin creado:', admin.firstName);

  // Crear algunas ubicaciones
  await prisma.location.deleteMany({}); // Limpiar primero
  
  const location1 = await prisma.location.create({
    data: {
      name: 'Iglesia Central',
      type: 'SANTIAGO',
      address: 'Av. Principal 123',
      city: 'Santiago',
      country: 'Chile',
      color: '#3B82F6',
      phone: '123-456-7890',
      isActive: true,
    },
  });

  const location2 = await prisma.location.create({
    data: {
      name: 'Sede Norte',
      type: 'VINA_DEL_MAR',
      address: 'Calle Norte 456',
      city: 'Viña del Mar',
      country: 'Chile',
      color: '#10B981',
      phone: '123-456-7891',
      isActive: true,
    },
  });

  console.log('✅ Ubicaciones creadas:', location1.name, location2.name);

  // Crear algunos cantantes de prueba
  const singer1 = await prisma.user.upsert({
    where: { email: 'soprano1@cgplayer.com' },
    update: {},
    create: {
      email: 'soprano1@cgplayer.com',
      username: 'maria.gonzalez',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'González',
      isActive: true,
    },
  });

  const singer2 = await prisma.user.upsert({
    where: { email: 'alto1@cgplayer.com' },
    update: {},
    create: {
      email: 'alto1@cgplayer.com',
      username: 'ana.lopez',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'López',
      isActive: true,
    },
  });

  const singer3 = await prisma.user.upsert({
    where: { email: 'tenor1@cgplayer.com' },
    update: {},
    create: {
      email: 'tenor1@cgplayer.com',
      username: 'carlos.martin',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Martín',
      isActive: true,
    },
  });

  console.log('✅ Cantantes creados:', singer1.firstName, singer2.firstName, singer3.firstName);

  // Crear un evento de prueba
  const event = await prisma.event.create({
    data: {
      title: 'Concierto de Navidad',
      description: 'Evento especial de temporada navideña',
      date: new Date('2024-12-25T19:00:00Z'),
      category: 'Concierto',
      country: 'Chile',
      isPublic: true,
      allowExternalJoin: true,
      createdBy: admin.id,
      locationId: location1.id,
    },
  });

  console.log('✅ Evento creado:', event.title);

  // Agregar asistentes al evento con diferentes estados
  await prisma.eventAttendee.createMany({
    data: [
      {
        eventId: event.id,
        userId: singer1.id,
        addedBy: admin.id,
        status: 'PENDING', // Estado por defecto
        attendanceConfirmed: null,
      },
      {
        eventId: event.id,
        userId: singer2.id,
        addedBy: admin.id,
        status: 'CONFIRMED',
        attendanceConfirmed: true,
      },
      {
        eventId: event.id,
        userId: singer3.id,
        addedBy: admin.id,
        status: 'PENDING',
        attendanceConfirmed: false,
        nonAttendanceComment: 'Conflicto de horarios',
      },
    ],
  });

  console.log('✅ Asistentes al evento agregados con diferentes estados');

  console.log('🎉 Seed completado exitosamente!');
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
