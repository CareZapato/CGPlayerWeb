const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMissingUser() {
  try {
    console.log('🔄 Creando usuario faltante del token...');
    
    // Obtener una ubicación por defecto
    const defaultLocation = await prisma.location.findFirst();
    
    if (!defaultLocation) {
      console.error('❌ No hay ubicaciones disponibles');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear el usuario específico del nuevo error
    const user = await prisma.user.create({
      data: {
        id: 'cmf48bz1c0006fwz8mzr8adja', // ID específico del nuevo error
        email: 'admin.token@cgplayer.com',
        username: 'admin.token',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Token Fix',
        isActive: true,
        locationId: defaultLocation.id
      }
    });

    console.log('✅ Usuario del token creado:', user.username);

    // Asignar rol ADMIN
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${user.id}, 'ADMIN', NOW())
    `;

    console.log('✅ Rol ADMIN asignado');

    // Verificar que el usuario existe ahora
    const verification = await prisma.user.findUnique({
      where: { id: 'cmf48bz1c0006fwz8mzr8adja' }
    });

    if (verification) {
      console.log('✅ Verificación exitosa: Usuario del token existe');
    } else {
      console.log('❌ Error: Usuario aún no existe');
    }
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Usuario ya existe en la base de datos');
    } else {
      console.error('❌ Error creando usuario faltante:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createMissingUser();
