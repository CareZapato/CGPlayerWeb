const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSpecificUser() {
  try {
    console.log('🔄 Creando usuario específico del error...');
    
    // Obtener una ubicación por defecto
    const defaultLocation = await prisma.location.findFirst();
    
    if (!defaultLocation) {
      console.error('❌ No hay ubicaciones disponibles');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear el usuario específico del error
    const user = await prisma.user.create({
      data: {
        id: 'cmf2x9hu70006g2wksnbe5lex', // ID específico del error
        email: 'admin.error@cgplayer.com',
        username: 'admin.error',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Error Fix',
        isActive: true,
        locationId: defaultLocation.id
      }
    });

    console.log('✅ Usuario específico creado:', user);

    // Asignar rol ADMIN
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${user.id}, 'ADMIN', NOW())
    `;

    console.log('✅ Rol ADMIN asignado');

    // Verificar que el usuario existe ahora
    const verification = await prisma.user.findUnique({
      where: { id: 'cmf2x9hu70006g2wksnbe5lex' }
    });

    if (verification) {
      console.log('✅ Verificación exitosa: Usuario existe en la base de datos');
    } else {
      console.log('❌ Error: Usuario aún no existe');
    }
    
  } catch (error) {
    console.error('❌ Error creando usuario específico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSpecificUser();
