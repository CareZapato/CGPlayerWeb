const fetch = require('node-fetch');

async function testSeed() {
  try {
    console.log('🧪 Probando endpoint de seed...');
    
    // Primero login como admin
    const loginResponse = await fetch('http://192.168.1.10:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@cgplayer.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ No hay usuarios aún, procediendo con seed sin autenticación...');
    }

    // Intentar seed
    const seedResponse = await fetch('http://192.168.1.10:3001/admin/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (seedResponse.ok) {
      const result = await seedResponse.json();
      console.log('✅ Seed exitoso:', result);
    } else {
      const error = await seedResponse.text();
      console.log('❌ Error en seed:', error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSeed();
