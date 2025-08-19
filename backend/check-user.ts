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
    
    console.log('👤 Usuario:', user?.firstName, user?.lastName);
    console.log('📧 Email:', user?.email);
    console.log('🎵 Tipos de voz:', user?.voiceProfiles?.map(vp => vp.voiceType));
    
    // Obtener roles del usuario
    const userRoles = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${user?.id}
    `;
    console.log('👥 Roles:', (userRoles as any[]).map(r => r.role));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
