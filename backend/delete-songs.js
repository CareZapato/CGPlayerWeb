const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSongs() {
  try {
    const result = await prisma.song.deleteMany();
    console.log('✅ Canciones eliminadas:', result.count);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSongs();
