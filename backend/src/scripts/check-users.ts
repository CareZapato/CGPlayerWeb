import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios y roles...\n');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    console.log(`📊 Total de usuarios: ${users.length}\n`);

    for (const user of users) {
      console.log(`👤 Usuario: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Activo: ${user.isActive}`);
      
      // Obtener roles usando query raw
      const userRoles = await prisma.$queryRaw`
        SELECT role FROM user_roles WHERE "userId" = ${user.id}
      `;
      
      console.log(`   Roles: ${(userRoles as any[]).map(r => r.role).join(', ') || 'Sin roles'}`);
      console.log('');
    }

    // Verificar tabla de roles directamente
    console.log('🏷️  Verificando tabla user_roles...');
    const allRoles = await prisma.$queryRaw`
      SELECT "userId", role FROM user_roles ORDER BY "userId"
    `;
    
    console.log('Roles en BD:', allRoles);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
