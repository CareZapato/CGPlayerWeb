import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedOnlyExistingSongs() {
  console.log('🔄 Creando canciones solo para archivos existentes...');
  
  try {
    // Obtener el usuario admin para asignar como uploader
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.error('❌ No se encontró usuario admin');
      return;
    }

    const songsDir = path.join(__dirname, '../../uploads/songs');
    
    if (!fs.existsSync(songsDir)) {
      console.error('❌ Directorio uploads/songs no existe');
      return;
    }

    const folders = fs.readdirSync(songsDir);
    console.log(`📁 Carpetas encontradas: ${folders.length}`);
    
    for (const folderName of folders) {
      const folderPath = path.join(songsDir, folderName);
      
      if (!fs.statSync(folderPath).isDirectory()) continue;
      
      const files = fs.readdirSync(folderPath);
      const audioFiles = files.filter(file => 
        file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav')
      );

      console.log(`📂 Procesando carpeta: ${folderName} (${audioFiles.length} archivos)`);

      if (audioFiles.length === 0) {
        console.log(`⚠️  Carpeta ${folderName} sin archivos de audio`);
        continue;
      }

      // Extraer información del nombre de la carpeta
      let songTitle = folderName;
      let timestamp = '';
      
      // Si tiene timestamp al final, extraerlo
      const timestampMatch = folderName.match(/^(.+)_(\d+)$/);
      if (timestampMatch) {
        songTitle = timestampMatch[1].replace(/_/g, ' ');
        timestamp = timestampMatch[2];
      }

      // Capitalizar título
      songTitle = songTitle.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');

      let parentSong = null;
      let createdVersions = 0;

      for (const fileName of audioFiles) {
        try {
          // Determinar tipo de voz basado en el nombre del archivo
          let voiceType: string | null = null;
          const lowerFileName = fileName.toLowerCase();
          
          if (lowerFileName.includes('soprano')) voiceType = 'SOPRANO';
          else if (lowerFileName.includes('contralto')) voiceType = 'CONTRALTO';
          else if (lowerFileName.includes('tenor')) voiceType = 'TENOR';
          else if (lowerFileName.includes('baritone') || lowerFileName.includes('baritono')) voiceType = 'BARITONE';
          else if (lowerFileName.includes('bass') || lowerFileName.includes('bajo')) voiceType = 'BASS';
          else if (lowerFileName.includes('coro')) voiceType = 'CORO';
          else voiceType = 'ORIGINAL';

          // Obtener stats del archivo para el tamaño
          const filePath = path.join(folderPath, fileName);
          const stats = fs.statSync(filePath);
          
          // Si es la primera canción de este grupo, crear canción padre
          if (!parentSong) {
            parentSong = await prisma.song.create({
              data: {
                title: songTitle,
                artist: 'Artista Desconocido',
                genre: 'Himnos',
                fileName: '', // Canción padre sin archivo específico
                filePath: '',
                fileSize: 0,
                mimeType: '',
                folderName: folderName,
                uploadedBy: admin.id,
                isActive: true
              }
            });
            console.log(`✅ Canción padre creada: ${songTitle}`);
          }

          // Crear versión individual
          const version = await prisma.song.create({
            data: {
              title: songTitle,
              artist: 'Artista Desconocido',
              genre: 'Himnos',
              voiceType: voiceType as any,
              fileName: fileName,
              filePath: `${folderName}/${fileName}`,
              fileSize: stats.size,
              mimeType: fileName.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg',
              folderName: folderName,
              parentSongId: parentSong.id,
              uploadedBy: admin.id,
              isActive: true
            }
          });

          console.log(`  ✅ Versión creada: ${voiceType} (${fileName})`);
          createdVersions++;

        } catch (error) {
          console.error(`  ❌ Error creando versión para ${fileName}:`, error);
        }
      }

      console.log(`📊 Canción ${songTitle}: ${createdVersions} versiones creadas\n`);
    }

    console.log('✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOnlyExistingSongs();
