const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignRoles() {
  console.log('🎭 Asignando roles a usuarios de prueba...');

  try {
    // Buscar usuarios sin el admin automático
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@cgplayer.com', 'soprano1@cgplayer.com', 'alto1@cgplayer.com', 'tenor1@cgplayer.com']
        }
      }
    });

    console.log('👥 Usuarios encontrados:', users.length);

    // Asignar roles
    for (const user of users) {
      let rolesToAssign = [];
      
      if (user.email === 'admin@cgplayer.com') {
        rolesToAssign = ['ADMIN'];
      } else {
        rolesToAssign = ['CANTANTE'];
      }

      console.log(`📝 Asignando roles a ${user.firstName} (${user.email}):`, rolesToAssign);

      // Crear roles si no existen
      for (const role of rolesToAssign) {
        await prisma.userRole_DB.upsert({
          where: {
            userId_role: {
              userId: user.id,
              role: role
            }
          },
          create: {
            userId: user.id,
            role: role
          },
          update: {}
        });
      }
    }

    console.log('✅ Roles asignados correctamente!');

    // Verificar resultado
    const usersWithRoles = await prisma.user.findMany({
      include: {
        roles: {
          select: {
            role: true
          }
        }
      }
    });

    console.log('\n📊 Estado final de usuarios:');
    usersWithRoles.forEach(user => {
      console.log(`  👤 ${user.firstName} (${user.email}): ${user.roles.map(r => r.role).join(', ') || 'Sin roles'}`);
    });

  } catch (error) {
    console.error('❌ Error asignando roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignRoles();
