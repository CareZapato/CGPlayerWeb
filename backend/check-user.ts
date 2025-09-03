import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'cantante1@cgplayer.com' },
      include: {
        voiceProfiles: true
      }
    });
    
    
    // Obtener roles del usuario
    const userRoles = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${user?.id}
    `;
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
