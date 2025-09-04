const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createInitialAdmin() {
  try {
    console.log('🔧 Creando administrador inicial...');

    // Verificar si ya hay usuarios
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('❌ Ya existen usuarios en el sistema. Use el endpoint /admin/seed con autenticación.');
      return;
    }

    // Crear ubicación Santiago básica
    const location = await prisma.location.create({
      data: {
        name: 'Santiago',
        type: 'SANTIAGO',
        address: 'Plaza de Armas',
        city: 'Santiago',
        region: 'Metropolitana',
        color: '#3b82f6'
      }
    });

    // Crear admin inicial
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        firstName: 'Administrador',
        lastName: 'Inicial',
        password: hashedPassword,
        isActive: true,
        locationId: location.id
      }
    });

    // Asignar rol ADMIN
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${admin.id}, 'ADMIN'::"UserRole", NOW())
    `;

    console.log('✅ Admin inicial creado:');
    console.log('   📧 Email: admin@cgplayer.com');
    console.log('   🔑 Password: admin123');
    console.log('');
    console.log('🚀 Ahora puedes usar el endpoint POST /admin/seed con autenticación para cargar todos los datos.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialAdmin();
