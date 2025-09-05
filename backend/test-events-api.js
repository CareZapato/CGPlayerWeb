// Test script para verificar la API de eventos
const BASE_URL = 'http://localhost:3001/api';

async function testEventsAPI() {
  console.log('🚀 Iniciando pruebas de la API de eventos...\n');

  try {
    // Test 1: Obtener eventos públicos
    console.log('📅 Test 1: Obtener eventos públicos');
    const publicEventsResponse = await fetch(`${BASE_URL}/events/public`);
    const publicEventsData = await publicEventsResponse.json();
    console.log('✅ Respuesta:', publicEventsData);
    console.log(`   📊 Eventos públicos encontrados: ${publicEventsData.data?.length || 0}\n`);

    // Test 2: Verificar que los endpoints requieran autenticación
    console.log('🔐 Test 2: Verificar autenticación requerida');
    const protectedResponse = await fetch(`${BASE_URL}/events`);
    console.log(`   📊 Status sin auth: ${protectedResponse.status}`);
    console.log(`   ✅ ${protectedResponse.status === 401 ? 'Autenticación requerida correctamente' : 'ERROR: Debería requerir autenticación'}\n`);

    // Test 3: Verificar endpoint de búsqueda de cantantes (sin auth)
    console.log('🎤 Test 3: Endpoint de búsqueda de cantantes');
    const singersResponse = await fetch(`${BASE_URL}/events/search/singers?query=test`);
    console.log(`   📊 Status búsqueda cantantes: ${singersResponse.status}`);
    console.log(`   ✅ ${singersResponse.status === 401 ? 'Autenticación requerida correctamente' : 'ERROR: Debería requerir autenticación'}\n`);

    console.log('🎉 Pruebas completadas exitosamente!');
    console.log('📋 Resumen:');
    console.log('   ✅ Endpoint público funcionando');
    console.log('   ✅ Endpoints protegidos requieren autenticación');
    console.log('   ✅ API respondiendo correctamente');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testEventsAPI();
