import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function cleanupOrphanedSongs() {
  console.log('🔄 Iniciando limpieza de canciones sin archivos...');
  
  try {
    // Obtener todas las canciones activas
    const songs = await prisma.song.findMany({
      where: { isActive: true }
    });

    console.log(`📊 Encontradas ${songs.length} canciones en la base de datos`);

    let deletedCount = 0;
    let validCount = 0;

    for (const song of songs) {
      // Solo verificar canciones que tienen archivos (no contenedoras)
      if (song.fileName && song.folderName) {
        const filePath = path.join(__dirname, '../../uploads/songs', song.folderName, song.fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Archivo no encontrado, eliminando: ${song.title} - ${filePath}`);
          
          // Eliminar la canción de la base de datos
          await prisma.song.update({
            where: { id: song.id },
            data: { isActive: false }
          });
          
          deletedCount++;
        } else {
          console.log(`✅ Archivo válido: ${song.title}`);
          validCount++;
        }
      } else if (!song.fileName && song.parentSongId === null) {
        // Es una canción contenedora, verificar si tiene hijas válidas
        const childVersions = await prisma.song.findMany({
          where: { parentSongId: song.id, isActive: true }
        });

        let hasValidChildren = false;
        for (const child of childVersions) {
          if (child.fileName && child.folderName) {
            const childFilePath = path.join(__dirname, '../../uploads/songs', child.folderName, child.fileName);
            if (fs.existsSync(childFilePath)) {
              hasValidChildren = true;
              break;
            }
          }
        }

        if (!hasValidChildren) {
          console.log(`❌ Contenedor sin hijos válidos, eliminando: ${song.title}`);
          
          // Primero eliminar todos los hijos
          await prisma.song.updateMany({
            where: { parentSongId: song.id },
            data: { isActive: false }
          });
          
          // Luego eliminar el contenedor
          await prisma.song.update({
            where: { id: song.id },
            data: { isActive: false }
          });
          
          deletedCount++;
        } else {
          console.log(`✅ Contenedor válido: ${song.title}`);
          validCount++;
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`✅ Canciones válidas: ${validCount}`);
    console.log(`❌ Canciones eliminadas: ${deletedCount}`);
    console.log(`📱 Total procesadas: ${songs.length}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedSongs();
