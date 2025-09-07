const axios = require('axios');

async function testLogin() {
  console.log('🔐 Probando login de usuario...');
  
  try {
    const response = await axios.post('http://192.168.1.10:3001/api/auth/login', {
      login: 'admin@cgplayer.com',
      password: 'admin123'
    });

    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', response.data.user.firstName, response.data.user.lastName);
    console.log('🎭 Roles:', response.data.user.roles.map(r => r.role));
    console.log('🔑 Token recibido:', response.data.token ? 'SÍ' : 'NO');

    // Probar endpoint que requiere autenticación
    console.log('\n🧭 Probando endpoint /events/visible...');
    
    const eventsResponse = await axios.get('http://192.168.1.10:3001/api/events/visible', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });

    console.log('📋 Eventos encontrados:', eventsResponse.data.data.length);
    if (eventsResponse.data.data.length > 0) {
      console.log('📅 Primer evento:', eventsResponse.data.data[0].title);
    }

  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
  }
}

testLogin();
