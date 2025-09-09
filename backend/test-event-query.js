const { PrismaClient } = require('@prisma/client');

async function testEventQuery() {
  const prisma = new PrismaClient();
  
  try {
    // Obtener un evento que tenga attendees
    const events = await prisma.event.findMany({
      where: {
        attendees: {
          some: {}
        }
      },
      take: 1,
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            attendees: true
          }
        }
      }
    });
    
    if (events.length === 0) {
      console.log('❌ No se encontraron eventos con attendees');
      return;
    }
    
    const eventId = events[0].id;
    console.log(`🎭 Probando evento: ${events[0].title} (${eventId})`);
    console.log(`👥 Total attendees: ${events[0]._count.attendees}`);
    
    // Hacer la misma consulta que hace el endpoint
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        attendees: {
          include: {
            user: {
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                locationId: true,
                location: { select: { name: true } },
                assignedRoles: { select: { role: true } },
                voiceProfiles: { 
                  select: { 
                    voiceType: true, 
                    isPrimary: true 
                  } 
                }
              }
            }
          }
        }
      }
    });
    
    console.log('\n🔍 Resultado de la consulta:');
    console.log('Attendees encontrados:', event.attendees.length);
    
    if (event.attendees.length > 0) {
      const firstAttendee = event.attendees[0];
      console.log('\n👤 Primer attendee:');
      console.log('  Nombre:', `${firstAttendee.user.firstName} ${firstAttendee.user.lastName}`);
      console.log('  User ID:', firstAttendee.user.id);
      console.log('  VoiceProfiles:', firstAttendee.user.voiceProfiles);
      console.log('  Cantidad voiceProfiles:', firstAttendee.user.voiceProfiles?.length || 0);
      
      // Verificar algunos más
      console.log('\n🔍 Verificación de los primeros 5 attendees:');
      event.attendees.slice(0, 5).forEach((attendee, index) => {
        console.log(`  ${index + 1}. ${attendee.user.firstName} ${attendee.user.lastName}:`);
        console.log(`     Status: ${attendee.status}`);
        console.log(`     VoiceProfiles: ${JSON.stringify(attendee.user.voiceProfiles)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEventQuery();
