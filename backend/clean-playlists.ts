import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPlaylists() {
  try {

    // Eliminar items de playlists primero (foreign key)
    const deletedItems = await prisma.playlistItem.deleteMany({});

    // Eliminar playlists
    const deletedPlaylists = await prisma.playlist.deleteMany({});


  } catch (error) {
    console.error('❌ Error limpiando playlists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPlaylists();
