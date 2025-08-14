import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    // Eliminar todas las canciones (las relaciones se eliminarán automáticamente)
    const deletedSongs = await prisma.song.deleteMany();
    console.log(`🗑️ Eliminadas ${deletedSongs.count} canciones`);
    
    // Eliminar usuarios excepto el admin
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@cgplayer.com'
        }
      }
    });
    console.log(`🗑️ Eliminados ${deletedUsers.count} usuarios (manteniendo admin)`);
    
    console.log('✅ Base de datos limpia');
    console.log('');
    console.log('📊 Estado actual:');
    
    const songCount = await prisma.song.count();
    const userCount = await prisma.user.count();
    
    console.log(`   📀 Canciones: ${songCount}`);
    console.log(`   👥 Usuarios: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
