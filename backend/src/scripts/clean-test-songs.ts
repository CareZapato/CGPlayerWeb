import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestSongs() {
  try {
    console.log('🧹 Limpiando canciones de prueba...');
    
    // Eliminar todas las canciones de prueba
    const result = await prisma.song.deleteMany({
      where: {
        OR: [
          {
            title: {
              contains: 'You Raise Me Up'
            }
          },
          {
            title: {
              contains: 'asdasdsa'
            }
          }
        ]
      }
    });
    
    console.log(`✅ Eliminadas ${result.count} canciones de prueba`);
    console.log('🎵 Base de datos lista para nuevas pruebas');
    
  } catch (error) {
    console.error('❌ Error limpiando canciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestSongs();
