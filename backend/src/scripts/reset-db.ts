import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Iniciando reset completo de la base de datos...');

    // Limpiar todas las tablas en el orden correcto para evitar errores de foreign keys
    console.log('🗑️  Limpiando tablas...');
    
    // Primero las tablas que tienen foreign keys
    await prisma.lyricsFile.deleteMany();
    await prisma.lyric.deleteMany();
    await prisma.playlistItem.deleteMany();
    await prisma.playlist.deleteMany();
    await prisma.eventSong.deleteMany();
    await prisma.event.deleteMany();
    await prisma.soloist.deleteMany();
    await prisma.songAssignment.deleteMany();
    await prisma.song.deleteMany();
    await prisma.userVoiceProfile.deleteMany();
    await prisma.userRole_DB.deleteMany();
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();

    console.log('✅ Todas las tablas han sido limpiadas');
    console.log('📊 La base de datos está lista para recibir nuevos datos');
    console.log('');
    console.log('💡 Ejecuta "npm run db:seed" para cargar los datos básicos');
    console.log('   o "npm run db:init" para reset + seed automático');

  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase().catch((error) => {
  console.error('❌ Script falló:', error);
  process.exit(1);
});
