const fetch = require('node-fetch');

async function testEventEndpoint() {
  try {
    // Primero necesitamos autenticarnos
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@cgplayer.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ Error en login:', loginData);
      return;
    }

    console.log('✅ Login exitoso');
    const token = loginData.data.token;

    // Ahora hacer la petición al evento específico
    const eventId = 'cmfans4c0011rfcih49oyp9eb'; // El ID del evento de los logs
    
    console.log(`🎭 Haciendo petición a evento: ${eventId}`);
    
    const eventResponse = await fetch(`http://localhost:3001/api/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const eventData = await eventResponse.json();
    
    if (!eventData.success) {
      console.log('❌ Error en evento:', eventData);
      return;
    }

    const event = eventData.data;
    console.log('🎯 Evento obtenido:', {
      id: event.id,
      title: event.title,
      attendeesCount: event.attendees?.length || 0
    });

    if (event.attendees && event.attendees.length > 0) {
      const firstAttendee = event.attendees[0];
      console.log('👤 Primer attendee desde HTTP:');
      console.log('  User ID:', firstAttendee.user.id);
      console.log('  Nombre:', `${firstAttendee.user.firstName} ${firstAttendee.user.lastName}`);
      console.log('  User keys:', Object.keys(firstAttendee.user));
      console.log('  Tiene voiceProfiles:', 'voiceProfiles' in firstAttendee.user);
      console.log('  VoiceProfiles value:', firstAttendee.user.voiceProfiles);
      console.log('  User completo:', JSON.stringify(firstAttendee.user, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEventEndpoint();
