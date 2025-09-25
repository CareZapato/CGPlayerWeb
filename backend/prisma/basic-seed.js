const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Iniciando seed básico para CGPlayerWeb...');

    // 1. Crear ubicación básica
    console.log('📍 Creando ubicación...');
    const location = await prisma.location.create({
      data: {
        name: 'Santiago Centro',
        type: 'SANTIAGO',
        city: 'Santiago',
        address: 'Santiago, Chile'
      }
    });

    // 2. Crear usuario admin
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        status: 'CONFIRMED',
        locationId: location.id
      }
    });

    // 3. Asignar rol admin
    console.log('🔐 Asignando rol de administrador...');
    await prisma.userRole_DB.create({
      data: {
        userId: admin.id,
        role: 'ADMIN'
      }
    });

    // 4. Crear usuario director
    console.log('👤 Creando usuario director...');
    const directorPassword = await bcrypt.hash('director123', 10);
    const director = await prisma.user.create({
      data: {
        email: 'director@cgplayer.com',
        username: 'director',
        password: directorPassword,
        firstName: 'Director',
        lastName: 'Prueba',
        status: 'CONFIRMED',
        locationId: location.id
      }
    });

    // 5. Asignar rol director
    console.log('🎯 Asignando rol de director...');
    await prisma.userRole_DB.create({
      data: {
        userId: director.id,
        role: 'DIRECTOR'
      }
    });

    console.log('✅ Seed básico completado exitosamente');
    console.log(`📧 Admin: admin@cgplayer.com / admin123`);
    console.log(`🎯 Director: director@cgplayer.com / director123`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });