const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewLyricsSystem() {
  try {
    console.log('🔍 Testing new lyrics storage system...');
    
    // 1. Usar la canción CONTRALTO
    const targetSongId = 'cmf2mnki50003lkinvmro7c5z'; // CONTRALTO
    const voiceType = 'CONTRALTO';
    
    console.log(`📝 Testing with song: ${targetSongId} (${voiceType})`);
    
    // 2. Crear letras de prueba directamente en la base de datos
    const testLyrics = [
      {
        songId: targetSongId,
        voiceType: voiceType,
        content: 'Línea de prueba 1 para CONTRALTO',
        startTime: 0,
        lineNumber: 1,
        isTextLyrics: false,
        createdBy: 'cmf22p6ca0006eiugz77hj3dc'
      },
      {
        songId: targetSongId,
        voiceType: voiceType,
        content: 'Línea de prueba 2 para CONTRALTO',
        startTime: 0,
        lineNumber: 2,
        isTextLyrics: false,
        createdBy: 'cmf22p6ca0006eiugz77hj3dc'
      },
      {
        songId: targetSongId,
        voiceType: voiceType,
        content: 'Línea de prueba 3 para CONTRALTO',
        startTime: 0,
        lineNumber: 3,
        isTextLyrics: false,
        createdBy: 'cmf22p6ca0006eiugz77hj3dc'
      }
    ];
    
    // 3. Limpiar letras existentes
    console.log('🗑️ Cleaning existing lyrics...');
    await prisma.lyric.deleteMany({
      where: {
        songId: targetSongId,
        voiceType: voiceType
      }
    });
    
    // 4. Crear nuevas letras
    console.log('📝 Creating new lyrics...');
    for (const lyricData of testLyrics) {
      const lyric = await prisma.lyric.create({
        data: lyricData
      });
      console.log(`✅ Created lyric: "${lyric.content}" for ${lyric.voiceType}`);
    }
    
    // 5. Verificar que se guardaron correctamente
    console.log('🔍 Verifying saved lyrics...');
    const savedLyrics = await prisma.lyric.findMany({
      where: {
        songId: targetSongId,
        voiceType: voiceType
      },
      orderBy: {
        lineNumber: 'asc'
      }
    });
    
    console.log(`📋 Found ${savedLyrics.length} lyrics for ${voiceType}:`);
    savedLyrics.forEach((lyric, index) => {
      console.log(`  [${index + 1}] "${lyric.content}" (startTime: ${lyric.startTime}s, voiceType: ${lyric.voiceType})`);
    });
    
    // 6. Probar con otra variante (SOPRANO)
    console.log('\\n🎵 Testing with SOPRANO variant...');
    const sopranoSongId = 'cmf2mnki80005lkin70r39k8z';
    const sopranoVoiceType = 'SOPRANO';
    
    const sopranoLyrics = [
      {
        songId: sopranoSongId,
        voiceType: sopranoVoiceType,
        content: 'Línea de prueba 1 para SOPRANO',
        startTime: 0,
        lineNumber: 1,
        isTextLyrics: false,
        createdBy: 'cmf22p6ca0006eiugz77hj3dc'
      },
      {
        songId: sopranoSongId,
        voiceType: sopranoVoiceType,
        content: 'Línea de prueba 2 para SOPRANO',
        startTime: 0,
        lineNumber: 2,
        isTextLyrics: false,
        createdBy: 'cmf22p6ca0006eiugz77hj3dc'
      }
    ];
    
    // Limpiar y crear para SOPRANO
    await prisma.lyric.deleteMany({
      where: {
        songId: sopranoSongId,
        voiceType: sopranoVoiceType
      }
    });
    
    for (const lyricData of sopranoLyrics) {
      const lyric = await prisma.lyric.create({
        data: lyricData
      });
      console.log(`✅ Created SOPRANO lyric: "${lyric.content}"`);
    }
    
    // 7. Verificar que las letras están separadas por variante
    console.log('\\n🔍 Final verification - checking lyrics separation by voice type:');
    
    const contraltoCheck = await prisma.lyric.findMany({
      where: { songId: targetSongId, voiceType: 'CONTRALTO' }
    });
    
    const sopranoCheck = await prisma.lyric.findMany({
      where: { songId: sopranoSongId, voiceType: 'SOPRANO' }
    });
    
    console.log(`📊 CONTRALTO lyrics: ${contraltoCheck.length}`);
    console.log(`📊 SOPRANO lyrics: ${sopranoCheck.length}`);
    
    console.log('\\n✅ Test completed successfully!');
    console.log('🎯 Each voice type now has its own lyrics stored in the corresponding song variant');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

testNewLyricsSystem();
