const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuarios: ${userCount}`);
    
    // Listar todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
        createdAt: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('👥 Usuarios encontrados:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Username: ${user.username}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Activo: ${user.isActive}`);
      console.log(`    Nombre: ${user.firstName} ${user.lastName}`);
      console.log(`    Creado: ${user.createdAt}`);
      console.log('    ---');
    });
    
    // Verificar el usuario específico del error
    const specificUser = await prisma.user.findUnique({
      where: { id: 'cmf2x9hu70006g2wksnbe5lex' }
    });
    
    console.log('\n🔍 Usuario específico del error:');
    if (specificUser) {
      console.log('✅ Usuario encontrado:', specificUser);
    } else {
      console.log('❌ Usuario NO encontrado con ID: cmf2x9hu70006g2wksnbe5lex');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
