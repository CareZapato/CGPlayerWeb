// Test script para verificar las consultas de solicitudes en el dashboard
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRequestsQueries() {
  try {
    console.log('🔍 Probando consultas de solicitudes...\n');

    const currentDate = new Date();
    console.log(`Fecha actual: ${currentDate}\n`);

    // 1. Solicitudes de eventos pendientes (para admin)
    const pendingEventRequests = await prisma.eventJoinRequest.count({
      where: {
        status: 'PENDING',
        event: {
          category: 'Evento',
          date: { gt: currentDate }
        }
      }
    });

    console.log(`📅 Solicitudes de eventos pendientes (admin): ${pendingEventRequests}`);

    // 2. Usuarios pendientes de confirmación (para admin)  
    const pendingUserRequests = await prisma.user.count({
      where: {
        status: 'PENDING'
      }
    });

    console.log(`👤 Usuarios pendientes de confirmación (admin): ${pendingUserRequests}`);
    console.log(`📊 Total de solicitudes (admin): ${pendingEventRequests + pendingUserRequests}\n`);

    // 3. Consultas para director (ejemplo con locationId)
    // Primero obtenemos un director de ejemplo
    const directorExample = await prisma.user.findFirst({
      where: {
        roles: {
          some: {
            role: 'DIRECTOR'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        locationId: true
      }
    });

    if (directorExample && directorExample.locationId) {
      console.log(`🎯 Testing para director: ${directorExample.firstName} ${directorExample.lastName}`);
      console.log(`📍 LocationId: ${directorExample.locationId}\n`);

      // Solicitudes de eventos para director
      const directorEventRequests = await prisma.eventJoinRequest.count({
        where: {
          status: 'PENDING',
          event: {
            category: 'Evento',
            date: { gt: currentDate },
            locationId: directorExample.locationId
          }
        }
      });

      // Usuarios pendientes para director
      const directorUserRequests = await prisma.user.count({
        where: {
          status: 'PENDING',
          locationId: directorExample.locationId
        }
      });

      console.log(`📅 Solicitudes de eventos pendientes (director): ${directorEventRequests}`);
      console.log(`👤 Usuarios pendientes de confirmación (director): ${directorUserRequests}`);
      console.log(`📊 Total de solicitudes (director): ${directorEventRequests + directorUserRequests}`);
    } else {
      console.log('ℹ️  No se encontró director con locationId para testing');
    }

    console.log('\n✅ Test completado exitosamente');

  } catch (error) {
    console.error('❌ Error durante el test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el test
if (require.main === module) {
  testRequestsQueries().catch(console.error);
}

module.exports = { testRequestsQueries };