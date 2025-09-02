import { createSongWithLyricsTransaction, verifySongLyricsCreation } from './services/songLyricsService';
import { PrismaClient, VoiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function testSongLyricsService() {
  console.log('🧪 Testing Song + Lyrics Service...');
  
  // Ejemplo de datos de entrada
  const testData = {
    title: 'Test Song with Lyrics',
    artist: 'Test Artist',
    uploadedVariants: [
      {
        voiceType: 'SOPRANO' as VoiceType,
        fileName: 'test-soprano.mp3',
        filePath: '/uploads/test-soprano.mp3',
        fileSize: 5000000,
        mimeType: 'audio/mpeg',
        folderName: 'test_song_folder'
      },
      {
        voiceType: 'TENOR' as VoiceType,
        fileName: 'test-tenor.mp3',
        filePath: '/uploads/test-tenor.mp3',
        fileSize: 4800000,
        mimeType: 'audio/mpeg',
        folderName: 'test_song_folder'
      }
    ],
    lyricsText: `Line one of test song lyrics
Line two of test song lyrics  
Line three of test song lyrics
Line four of test song lyrics

Second verse line one
Second verse line two
Second verse line three
Second verse line four`,
    replaceExistingLyrics: true,
    uploadedBy: 'cmf22p6ca0006eiugz77hj3dc' // Usuario admin por defecto
  };

  try {
    console.log('\n🎵 Creating song with lyrics...');
    
    const result = await createSongWithLyricsTransaction(prisma, testData);
    
    console.log('\n✅ Creation successful!');
    console.log(`📂 Parent Song ID: ${result.parentSong.id}`);
    console.log(`📄 Variants created: ${result.variants.length}`);
    console.log(`📝 Total lyrics created: ${result.lyricsCreated}`);
    
    // Verificar el resultado
    console.log('\n🔍 Verifying creation...');
    await verifySongLyricsCreation(prisma, result.parentSong.id);
    
    return result.parentSong.id;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Función para limpiar datos de prueba
async function cleanupTestData(parentSongId: string) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Obtener todas las canciones relacionadas
    const songs = await prisma.song.findMany({
      where: {
        OR: [
          { id: parentSongId },
          { parentSongId: parentSongId }
        ]
      }
    });

    const songIds = songs.map(s => s.id);
    
    // Eliminar letras
    const deletedLyrics = await prisma.lyric.deleteMany({
      where: {
        songId: { in: songIds }
      }
    });
    
    // Eliminar canciones
    const deletedSongs = await prisma.song.deleteMany({
      where: {
        id: { in: songIds }
      }
    });
    
    console.log(`🗑️ Deleted ${deletedLyrics.count} lyrics`);
    console.log(`🗑️ Deleted ${deletedSongs.count} songs`);
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Ejecutar test si este archivo se ejecuta directamente
if (require.main === module) {
  testSongLyricsService()
    .then(async (parentSongId) => {
      console.log('\n✅ Test completed successfully!');
      
      // Preguntar si quiere limpiar los datos de prueba
      console.log('\n🤔 Do you want to clean up test data? (Comment out the next line to keep data)');
      // await cleanupTestData(parentSongId);
      
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error('💥 Test failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

export { testSongLyricsService, cleanupTestData };
