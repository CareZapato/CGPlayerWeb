const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLyricsDirectDB() {
  console.log('🧪 Testing lyrics save logic directly in database...');
  
  const songId = 'cmf2ok5qe00019y3o71n7pza1'; // Parent song ID
  const voiceType = 'SOPRANO';
  
  console.log(`\n📋 Testing with songId: ${songId}, voiceType: ${voiceType}`);
  
  // 1. Get the song first (same as in lyrics.ts)
  const song = await prisma.song.findUnique({
    where: { id: songId }
  });
  
  console.log(`🎵 Original song:`, {
    id: song.id,
    title: song.title,
    voiceType: song.voiceType,
    parentSongId: song.parentSongId
  });
  
  // 2. Apply the exact same logic as in corrected lyrics.ts
  let targetSongId = songId; // Valor por defecto
  let targetVoiceType = voiceType;
  
  // Construir condiciones de búsqueda dinámicamente para evitar null values
  const searchConditions = [
    { id: songId },                    // Si el song actual ya tiene el voiceType correcto
    { parentSongId: songId }           // Si es una variante del song padre
  ];
  
  // Solo agregar búsqueda por parentSong si existe
  if (song.parentSongId) {
    searchConditions.push({ id: song.parentSongId });
  }
  
  console.log(`🔍 Search conditions:`, searchConditions);
  
  // Buscar directamente por voiceType en toda la base de datos
  const targetSong = await prisma.song.findFirst({
    where: {
      voiceType: voiceType,
      OR: searchConditions
    },
    select: {
      id: true,
      title: true,
      voiceType: true,
      parentSongId: true
    }
  });
  
  if (targetSong) {
    targetSongId = targetSong.id;
    targetVoiceType = targetSong.voiceType;
    
    console.log(`✅ Found target song:`, {
      id: targetSong.id,
      title: targetSong.title,
      voiceType: targetSong.voiceType,
      parentSongId: targetSong.parentSongId
    });
    
    console.log(`📝 FINAL TARGET: songId=${targetSongId}, voiceType=${targetVoiceType}`);
  } else {
    console.log(`❌ No target song found for voiceType: ${voiceType}`);
  }
  
  // 3. Simular el guardado de letras
  if (targetSong) {
    console.log(`\n💾 Would save lyrics to:`);
    console.log(`   - songId: ${targetSongId} (was using: ${songId})`);
    console.log(`   - voiceType: ${targetVoiceType}`);
    console.log(`   - Correct assignment: ${targetSongId !== songId ? '✅' : '❌'}`);
    
    // Verificar si hay letras existentes para comparar
    const existingLyrics = await prisma.lyric.findMany({
      where: {
        songId: songId, // Old way (wrong)
        voiceType: voiceType
      },
      take: 3
    });
    
    console.log(`\n📊 Existing lyrics with WRONG songId (${songId}):`, existingLyrics.length);
    
    const correctLyrics = await prisma.lyric.findMany({
      where: {
        songId: targetSongId, // New way (correct)
        voiceType: voiceType
      },
      take: 3
    });
    
    console.log(`📊 Existing lyrics with CORRECT songId (${targetSongId}):`, correctLyrics.length);
  }
  
  await prisma.$disconnect();
}

testLyricsDirectDB().catch(console.error);
