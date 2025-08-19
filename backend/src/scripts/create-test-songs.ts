import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestSongs() {
  try {
    console.log('🎵 Creando canciones de prueba...');

    // Obtener el ID del admin para asignar como uploader
    const admin = await prisma.user.findFirst({
      where: {
        roles: {
          some: {
            role: 'ADMIN'
          }
        }
      }
    });

    if (!admin) {
      console.error('❌ No se encontró un admin');
      return;
    }

    // Crear canción padre
    const parentSong1 = await prisma.song.create({
      data: {
        title: 'Amazing Grace',
        artist: 'Traditional',
        album: 'Hymns Collection',
        genre: 'Worship',
        fileName: 'amazing_grace_container.mp3',
        filePath: 'songs/amazing_grace_1755580000000',
        fileSize: 0,
        mimeType: 'multitrack/folder',
        voiceType: null,
        uploadedBy: admin.id,
        folderName: 'amazing_grace_1755580000000',
        parentSongId: null
      }
    });

    // Crear variaciones de voz para Amazing Grace
    const voiceTypes = ['SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO'];
    
    for (const voiceType of voiceTypes) {
      await prisma.song.create({
        data: {
          title: `Amazing Grace (${voiceType})`,
          artist: 'Traditional',
          album: 'Hymns Collection',
          genre: 'Worship',
          fileName: `amazing_grace_${voiceType.toLowerCase()}.mp3`,
          filePath: `songs/amazing_grace_1755580000000/amazing_grace_${voiceType.toLowerCase()}.mp3`,
          fileSize: 3500000,
          mimeType: 'audio/mpeg',
          voiceType: voiceType as any,
          uploadedBy: admin.id,
          folderName: 'amazing_grace_1755580000000',
          parentSongId: parentSong1.id
        }
      });
    }

    // Crear segunda canción padre
    const parentSong2 = await prisma.song.create({
      data: {
        title: 'How Great Thou Art',
        artist: 'Stuart K. Hine',
        album: 'Classic Hymns',
        genre: 'Worship',
        fileName: 'how_great_thou_art_container.mp3',
        filePath: 'songs/how_great_thou_art_1755580100000',
        fileSize: 0,
        mimeType: 'multitrack/folder',
        voiceType: null,
        uploadedBy: admin.id,
        folderName: 'how_great_thou_art_1755580100000',
        parentSongId: null
      }
    });

    // Crear variaciones para How Great Thou Art
    for (const voiceType of voiceTypes) {
      await prisma.song.create({
        data: {
          title: `How Great Thou Art (${voiceType})`,
          artist: 'Stuart K. Hine',
          album: 'Classic Hymns',
          genre: 'Worship',
          fileName: `how_great_thou_art_${voiceType.toLowerCase()}.mp3`,
          filePath: `songs/how_great_thou_art_1755580100000/how_great_thou_art_${voiceType.toLowerCase()}.mp3`,
          fileSize: 4200000,
          mimeType: 'audio/mpeg',
          voiceType: voiceType as any,
          uploadedBy: admin.id,
          folderName: 'how_great_thou_art_1755580100000',
          parentSongId: parentSong2.id
        }
      });
    }

    // Crear tercera canción padre
    const parentSong3 = await prisma.song.create({
      data: {
        title: 'Be Still My Soul',
        artist: 'Katharina von Schlegel',
        album: 'Peaceful Hymns',
        genre: 'Worship',
        fileName: 'be_still_my_soul_container.mp3',
        filePath: 'songs/be_still_my_soul_1755580200000',
        fileSize: 0,
        mimeType: 'multitrack/folder',
        voiceType: null,
        uploadedBy: admin.id,
        folderName: 'be_still_my_soul_1755580200000',
        parentSongId: null
      }
    });

    // Crear solo algunas variaciones para Be Still My Soul
    const limitedVoices = ['SOPRANO', 'TENOR', 'BAJO'];
    for (const voiceType of limitedVoices) {
      await prisma.song.create({
        data: {
          title: `Be Still My Soul (${voiceType})`,
          artist: 'Katharina von Schlegel',
          album: 'Peaceful Hymns',
          genre: 'Worship',
          fileName: `be_still_my_soul_${voiceType.toLowerCase()}.mp3`,
          filePath: `songs/be_still_my_soul_1755580200000/be_still_my_soul_${voiceType.toLowerCase()}.mp3`,
          fileSize: 3800000,
          mimeType: 'audio/mpeg',
          voiceType: voiceType as any,
          uploadedBy: admin.id,
          folderName: 'be_still_my_soul_1755580200000',
          parentSongId: parentSong3.id
        }
      });
    }

    console.log('✅ Canciones de prueba creadas exitosamente');
    console.log(`📊 Se crearon 3 canciones padre y ${voiceTypes.length * 2 + limitedVoices.length} variaciones`);

  } catch (error) {
    console.error('❌ Error creando canciones de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSongs();
