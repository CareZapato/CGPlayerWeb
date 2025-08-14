import { PrismaClient } from '@prisma/client';
import { parseFile } from 'music-metadata';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Función para obtener la duración de un archivo de audio
const getAudioDuration = async (filePath: string): Promise<number | null> => {
  try {
    console.log(`🎵 Analizando archivo: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Archivo no encontrado: ${filePath}`);
      return null;
    }
    
    const metadata = await parseFile(filePath);
    const duration = metadata.format.duration ? Math.round(metadata.format.duration) : null;
    console.log(`✅ Duración obtenida: ${duration} segundos`);
    return duration;
  } catch (error) {
    console.error(`❌ Error obteniendo duración de ${filePath}:`, error);
    return null;
  }
};

async function updateDurations() {
  try {
    console.log('🔄 Iniciando actualización de duraciones...');
    
    // Obtener todas las canciones que no tienen duración o tienen duración null
    const songs = await prisma.song.findMany({
      where: {
        isActive: true,
        OR: [
          { duration: null },
          { duration: 0 }
        ]
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        filePath: true,
        folderName: true,
        voiceType: true
      }
    });

    console.log(`📊 Encontradas ${songs.length} canciones sin duración`);

    if (songs.length === 0) {
      console.log('✅ Todas las canciones ya tienen duración');
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const song of songs) {
      try {
        console.log(`\n🎵 Procesando: ${song.title} ${song.voiceType ? `(${song.voiceType})` : ''}`);
        
        // Construir la ruta del archivo
        let fullPath: string;
        
        if (song.folderName && song.fileName) {
          // Nuevo formato con carpeta
          fullPath = path.join(__dirname, '../../uploads/songs', song.folderName, song.fileName);
        } else if (song.filePath) {
          // Formato anterior con ruta relativa
          fullPath = path.join(__dirname, '../../uploads', song.filePath);
        } else {
          console.log(`❌ No se puede determinar la ruta del archivo para ${song.title}`);
          failed++;
          continue;
        }

        console.log(`📁 Buscando archivo en: ${fullPath}`);

        const duration = await getAudioDuration(fullPath);
        
        if (duration !== null) {
          await prisma.song.update({
            where: { id: song.id },
            data: { duration: duration }
          });
          
          console.log(`✅ Actualizado ${song.title}: ${duration} segundos`);
          updated++;
        } else {
          console.log(`❌ No se pudo obtener duración para ${song.title}`);
          failed++;
        }
        
        // Pequeña pausa para no sobrecargar el sistema
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error procesando ${song.title}:`, error);
        failed++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`✅ Actualizadas: ${updated}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📱 Total procesadas: ${updated + failed}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateDurations();
}

export { updateDurations };
