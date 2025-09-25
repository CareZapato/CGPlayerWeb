// Script para crear datos de prueba para las solicitudes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestRequests() {
  try {
    console.log('🏗️  Creando datos de prueba para solicitudes...\n');

    // 1. Crear un usuario con status PENDING
    const testUser = await prisma.user.create({
      data: {
        email: 'usuario.pendiente@test.com',
        username: 'usuario_pendiente',
        firstName: 'Usuario',
        lastName: 'Pendiente',
        phone: '+56912345678',
        status: 'PENDING',
        locationId: 'cmfanlfzw0005fcih3gem4l39', // ID de una ubicación existente
        password: '$2b$12$LQv3c1yqBwlFHAhyyMLAaO.8aVpjjNY3dTbmYrg8BVnbfgQYLRqKC' // "test123"
      }
    });

    console.log(`👤 Usuario pendiente creado: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);

    // 2. Crear un evento futuro
    const futureEvent = await prisma.event.create({
      data: {
        title: 'Evento de Prueba Futuro',
        description: 'Este es un evento futuro para probar las solicitudes',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En una semana
        category: 'Evento',
        locationId: 'cmfanlfzw0005fcih3gem4l39',
        createdBy: 'cmfanlg5w000dfcih7ibmzik8' // ID del admin
      }
    });

    console.log(`📅 Evento futuro creado: ${futureEvent.title}`);

    // 3. Crear una solicitud de evento pendiente
    const eventRequest = await prisma.eventJoinRequest.create({
      data: {
        eventId: futureEvent.id,
        userId: 'cmfanlg5w000dfcih7ibmzik8', // ID del admin como ejemplo
        status: 'PENDING'
      }
    });

    console.log(`📝 Solicitud de evento creada para evento: ${futureEvent.title}`);

    // 4. Crear otro usuario pendiente para el director
    const directorUser = await prisma.user.create({
      data: {
        email: 'director.pendiente@test.com',
        username: 'director_pendiente',
        firstName: 'Director',
        lastName: 'Pendiente',
        phone: '+56987654321',
        status: 'PENDING',
        locationId: 'cmfanlfzw0005fcih3gem4l39', // Misma ubicación que el director de prueba
        password: '$2b$12$LQv3c1yqBwlFHAhyyMLAaO.8aVpjjNY3dTbmYrg8BVnbfgQYLRqKC'
      }
    });

    console.log(`🎯 Usuario pendiente para director creado: ${directorUser.firstName} ${directorUser.lastName}`);

    console.log('\n✅ Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`- 2 usuarios con status PENDING`);
    console.log(`- 1 evento futuro`);
    console.log(`- 1 solicitud de evento pendiente`);
    console.log(`\n🔍 Ahora el dashboard debería mostrar:`);
    console.log(`- Admin: 1 solicitud de evento + 2 usuarios pendientes = 3 solicitudes total`);
    console.log(`- Director: 1 solicitud de evento + 2 usuarios pendientes = 3 solicitudes total`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestRequests().catch(console.error);
}

module.exports = { createTestRequests };