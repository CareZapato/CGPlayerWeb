import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPlaylists() {
  try {
    console.log('🗑️ Eliminando playlists existentes...');

    // Eliminar items de playlists primero (foreign key)
    const deletedItems = await prisma.playlistItem.deleteMany({});
    console.log(`   ✅ ${deletedItems.count} items de playlists eliminados`);

    // Eliminar playlists
    const deletedPlaylists = await prisma.playlist.deleteMany({});
    console.log(`   ✅ ${deletedPlaylists.count} playlists eliminadas`);

    console.log('✅ Limpieza de playlists completada');

  } catch (error) {
    console.error('❌ Error limpiando playlists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPlaylists();
