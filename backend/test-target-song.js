const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTargetSongLogic() {
  console.log('🔍 Testing target song logic...');
  
  const songId = 'cmf2ok5qe00019y3o71n7pza1'; // Parent song ID
  const voiceType = 'SOPRANO';
  
  console.log(`\n📋 Testing for songId: ${songId}, voiceType: ${voiceType}`);
  
  // 1. Get the song first
  const song = await prisma.song.findUnique({
    where: { id: songId }
  });
  
  console.log(`\n🎵 Original song:`, {
    id: song.id,
    title: song.title,
    voiceType: song.voiceType,
    parentSongId: song.parentSongId
  });
  
  // 2. Test the search logic from lyrics.ts
  const searchConditions = [
    { id: songId },                    // Si el song actual ya tiene el voiceType correcto
    { parentSongId: songId }           // Si es una variante del song padre
  ];
  
  // Solo agregar búsqueda por parentSong si existe
  if (song.parentSongId) {
    searchConditions.push({ id: song.parentSongId });
  }
  
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
  
  console.log(`\n🎯 Target song found:`, targetSong);
  
  if (!targetSong) {
    console.log(`\n🔍 No direct match, searching by title pattern...`);
    
    const songsByTitle = await prisma.song.findMany({
      where: {
        voiceType: voiceType,
        title: {
          contains: song.title.split(' - ')[0] // Buscar por la parte principal del título
        }
      },
      select: {
        id: true,
        title: true,
        voiceType: true,
        parentSongId: true
      },
      take: 5
    });
    
    console.log(`\n📋 Songs by title pattern:`, songsByTitle);
  }
  
  // 3. Show what SHOULD be the correct target
  console.log(`\n🎯 What SHOULD be the correct target for ${voiceType}:`);
  const correctTarget = await prisma.song.findFirst({
    where: {
      voiceType: voiceType,
      parentSongId: songId
    }
  });
  
  console.log(`✅ Correct target:`, {
    id: correctTarget?.id,
    title: correctTarget?.title,
    voiceType: correctTarget?.voiceType,
    parentSongId: correctTarget?.parentSongId
  });
  
  await prisma.$disconnect();
}

testTargetSongLogic().catch(console.error);
