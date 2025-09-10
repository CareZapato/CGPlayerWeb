// Script temporal para verificar el estado de las ubicaciones
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLocations() {
  try {
    console.log('🔍 Verificando ubicaciones en la base de datos...');
    
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n✅ Encontradas ${locations.length} ubicaciones activas:`);
    locations.forEach((location, index) => {
      console.log(`${index + 1}. ID: ${location.id}`);
      console.log(`   Name: ${location.name}`);
      console.log(`   City: ${location.city}`);
      console.log(`   Address: ${location.address || 'N/A'}`);
      console.log(`   Active: ${location.isActive}`);
      console.log('   ---');
    });
    
    // Verificar si tenemos las ubicaciones esperadas
    const expectedCities = ['Santiago', 'Antofagasta', 'Valparaíso', 'Concepción', 'Valdivia'];
    console.log('\n🎯 Verificando ubicaciones esperadas:');
    
    expectedCities.forEach(city => {
      const found = locations.find(loc => 
        loc.city.toLowerCase().includes(city.toLowerCase()) || 
        loc.name.toLowerCase().includes(city.toLowerCase())
      );
      if (found) {
        console.log(`✅ ${city}: Encontrada (ID: ${found.id})`);
      } else {
        console.log(`❌ ${city}: No encontrada`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error verificando ubicaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocations();
