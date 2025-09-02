import { PrismaClient, VoiceType } from '@prisma/client';

interface UploadedVariant {
  voiceType: VoiceType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  folderName?: string;
}

interface SongLyricsData {
  title: string;
  artist?: string;
  uploadedVariants: UploadedVariant[];
  lyricsText: string; // Letra completa como texto
  replaceExistingLyrics?: boolean;
  uploadedBy: string; // Cambiado de createdBy a uploadedBy (campo correcto del schema)
  locationId?: string;
}

interface CreatedTarget {
  songId: string;
  voiceType: VoiceType | null;
}

export class SongLyricsService {
  constructor(private prisma: PrismaClient) {}

  async createSongWithLyrics(data: SongLyricsData) {
    return await this.prisma.$transaction(async (tx) => {
      console.log('🎵 [SONG-LYRICS] Starting transactional creation...');

      // 1. Crear el song padre (voiceType = null)
      const parentSong = await tx.song.create({
        data: {
          title: data.title,
          artist: data.artist || 'Unknown',
          voiceType: null, // Padre siempre null
          parentSongId: null,
          fileName: 'parent', // Placeholder para el padre
          filePath: 'parent', // Placeholder para el padre
          fileSize: 0,
          mimeType: 'audio/parent',
          uploadedBy: data.uploadedBy, // Campo correcto del schema
          isActive: true
        }
      });

      console.log(`✅ [SONG-LYRICS] Created parent song: ${parentSong.id} - ${parentSong.title}`);

      // 2. Crear solo las variantes que realmente fueron subidas
      const createdVariants: any[] = [];
      for (const variant of data.uploadedVariants) {
        const variantSong = await tx.song.create({
          data: {
            title: `${data.title} (${variant.voiceType})`,
            artist: data.artist || 'Unknown',
            voiceType: variant.voiceType,
            parentSongId: parentSong.id,
            fileName: variant.fileName,
            filePath: variant.filePath,
            fileSize: variant.fileSize,
            mimeType: variant.mimeType,
            folderName: variant.folderName,
            uploadedBy: data.uploadedBy, // Campo correcto del schema
            isActive: true
          }
        });

        createdVariants.push(variantSong);
        console.log(`✅ [SONG-LYRICS] Created variant: ${variantSong.id} - ${variantSong.voiceType}`);
      }

      // 3. Construir targets = [padre] ∪ variantes creadas
      const targets: CreatedTarget[] = [
        {
          songId: parentSong.id,
          voiceType: null // Padre tiene voiceType null
        },
        ...createdVariants.map(variant => ({
          songId: variant.id,
          voiceType: variant.voiceType
        }))
      ];

      console.log(`📋 [SONG-LYRICS] Targets for lyrics creation:`, targets.length);
      targets.forEach(target => {
        console.log(`  - ${target.songId} (voiceType: ${target.voiceType || 'NULL'})`);
      });

      // 4. Si replaceExistingLyrics está activo: Borrar lyrics previos
      if (data.replaceExistingLyrics) {
        const targetSongIds = targets.map(t => t.songId);
        
        const deletedCount = await tx.lyric.deleteMany({
          where: {
            songId: {
              in: targetSongIds
            }
          }
        });

        console.log(`🗑️ [SONG-LYRICS] Deleted ${deletedCount.count} existing lyrics`);
      }

      // 5. Procesar la letra línea por línea
      const lyricsLines = data.lyricsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); // Filtrar líneas vacías

      console.log(`📝 [SONG-LYRICS] Processing ${lyricsLines.length} lyrics lines`);

      // 6. Para cada target y cada línea: crear registro en lyrics
      let totalLyricsCreated = 0;

      for (const target of targets) {
        console.log(`\n🎤 [SONG-LYRICS] Creating lyrics for songId: ${target.songId} (${target.voiceType || 'PARENT'})`);
        
        for (let lineIndex = 0; lineIndex < lyricsLines.length; lineIndex++) {
          const line = lyricsLines[lineIndex];
          
          await tx.lyric.create({
            data: {
              songId: target.songId,
              content: line,
              lineNumber: lineIndex + 1,
              startTime: 0, // Tiempo 0 como especificaste
              endTime: 0,   // Tiempo 0 como especificaste
              voiceType: target.voiceType, // Copiar del song correspondiente
              isTextLyrics: false, // FALSE para que aparezca en sección sincronizada
              isActive: true,
              createdBy: data.uploadedBy // Campo correcto
            }
          });

          totalLyricsCreated++;
        }

        console.log(`✅ [SONG-LYRICS] Created ${lyricsLines.length} lyrics for ${target.voiceType || 'PARENT'}`);
      }

      console.log(`\n🎉 [SONG-LYRICS] Transaction completed successfully!`);
      console.log(`📊 [SONG-LYRICS] Summary:`);
      console.log(`   - Parent song: ${parentSong.id}`);
      console.log(`   - Variants created: ${createdVariants.length}`);
      console.log(`   - Total targets: ${targets.length}`);
      console.log(`   - Lyrics lines: ${lyricsLines.length}`);
      console.log(`   - Total lyrics created: ${totalLyricsCreated}`);

      return {
        parentSong,
        variants: createdVariants,
        targets,
        lyricsCreated: totalLyricsCreated,
        lyricsLines: lyricsLines.length
      };
    });
  }

  // Método auxiliar para verificar el estado después de la creación
  async verifyCreation(parentSongId: string) {
    console.log('\n🔍 [VERIFICATION] Checking created songs and lyrics...');

    // Obtener todas las canciones relacionadas
    const songs = await this.prisma.song.findMany({
      where: {
        OR: [
          { id: parentSongId },
          { parentSongId: parentSongId }
        ]
      },
      orderBy: { voiceType: 'asc' }
    });

    console.log(`📋 [VERIFICATION] Found ${songs.length} songs:`);
    songs.forEach(song => {
      const isParent = !song.parentSongId;
      const prefix = isParent ? '📂' : '📄';
      console.log(`${prefix} ${song.title} | ID: ${song.id} | voiceType: ${song.voiceType || 'NULL'}`);
    });

    // Verificar lyrics para cada song
    for (const song of songs) {
      const lyrics = await this.prisma.lyric.findMany({
        where: { songId: song.id },
        orderBy: { lineNumber: 'asc' }
      });

      console.log(`\n📝 [VERIFICATION] Song ${song.voiceType || 'PARENT'} (${song.id}):`);
      console.log(`   - Lyrics count: ${lyrics.length}`);
      console.log(`   - isTextLyrics: ${lyrics[0]?.isTextLyrics}`);
      console.log(`   - voiceType: ${lyrics[0]?.voiceType || 'NULL'}`);
      
      if (lyrics.length > 0) {
        console.log(`   - First line: "${lyrics[0].content}"`);
        console.log(`   - Last line: "${lyrics[lyrics.length - 1].content}"`);
      }
    }

    return { songs, totalSongs: songs.length };
  }
}

// Función de utilidad para usar desde las rutas
export async function createSongWithLyricsTransaction(
  prisma: PrismaClient,
  data: SongLyricsData
) {
  const service = new SongLyricsService(prisma);
  return await service.createSongWithLyrics(data);
}

export async function verifySongLyricsCreation(
  prisma: PrismaClient,
  parentSongId: string
) {
  const service = new SongLyricsService(prisma);
  return await service.verifyCreation(parentSongId);
}
