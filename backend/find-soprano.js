const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSopranoUser() {
  const soprano = await prisma.user.findFirst({
    where: {
      voiceProfiles: {
        some: { voiceType: 'SOPRANO' }
      }
    },
    include: { voiceProfiles: true }
  });
  console.log('Usuario SOPRANO encontrado:');
  console.log('Email:', soprano?.email);
  console.log('Contraseña: cantante123');
  await prisma.$disconnect();
}

findSopranoUser();
