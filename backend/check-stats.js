const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getStats() {
  try {
    // Contar cantantes activos e inactivos
    const activeCantantes = await prisma.user.count({
      where: {
        isActive: true,
        roles: {
          some: {
            role: 'CANTANTE'
          }
        }
      }
    });

    const inactiveCantantes = await prisma.user.count({
      where: {
        isActive: false,
        roles: {
          some: {
            role: 'CANTANTE'
          }
        }
      }
    });

    const totalCantantes = activeCantantes + inactiveCantantes;
    const activePercentage = ((activeCantantes / totalCantantes) * 100).toFixed(1);
    const inactivePercentage = ((inactiveCantantes / totalCantantes) * 100).toFixed(1);

    console.log('🔄 Estado de cantantes:');
    console.log(`   Activos: ${activeCantantes} cantantes (${activePercentage}%)`);
    console.log(`   Inactivos: ${inactiveCantantes} cantantes (${inactivePercentage}%)`);
    console.log(`   Total: ${totalCantantes} cantantes`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getStats();
