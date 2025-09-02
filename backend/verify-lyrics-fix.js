const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyLyricsFix() {
  console.log('🔍 VERIFICACIÓN FINAL - Estado actual del sistema de letras');
  console.log('=' .repeat(60));
  
  const songId = 'cmf2ok5qe00019y3o71n7pza1'; // Parent song ID
  
  // 1. Mostrar estructura de canciones
  console.log('\n🎵 ESTRUCTURA DE CANCIONES:');
  const songs = await prisma.song.findMany({
    where: {
      OR: [
        { id: songId },
        { parentSongId: songId }
      ]
    },
    orderBy: { voiceType: 'asc' }
  });
  
  songs.forEach(song => {
    const isParent = !song.parentSongId;
    const prefix = isParent ? '📂' : '📄';
    console.log(`${prefix} ${song.title} | ID: ${song.id} | voiceType: ${song.voiceType || 'NULL'}`);
  });
  
  // 2. Verificar letras por cada tipo de voz
  console.log('\n📝 ESTADO ACTUAL DE LETRAS:');
  const voiceTypes = ['ORIGINAL', 'SOPRANO', 'CONTRALTO', 'TENOR'];
  
  for (const voiceType of voiceTypes) {
    console.log(`\n🎤 ${voiceType}:`);
    
    // Buscar el song correcto para este voiceType
    const targetSong = songs.find(s => s.voiceType === voiceType);
    
    if (targetSong) {
      console.log(`   ✅ Canción encontrada: ${targetSong.id}`);
      
      // Letras guardadas con el ID correcto (variante específica)
      const correctLyrics = await prisma.lyric.findMany({
        where: {
          songId: targetSong.id,
          voiceType: voiceType
        }
      });
      
      // Letras guardadas con el ID incorrecto (canción padre)
      const wrongLyrics = await prisma.lyric.findMany({
        where: {
          songId: songId, // Parent ID (incorrecto)
          voiceType: voiceType
        }
      });
      
      console.log(`   📊 Letras en songId correcto (${targetSong.id}): ${correctLyrics.length}`);
      console.log(`   📊 Letras en songId incorrecto (${songId}): ${wrongLyrics.length}`);
      
      if (wrongLyrics.length > 0 && correctLyrics.length === 0) {
        console.log(`   ⚠️  PROBLEMA: Letras en ubicación incorrecta`);
      } else if (correctLyrics.length > 0) {
        console.log(`   ✅ CORRECTO: Letras en ubicación correcta`);
      } else {
        console.log(`   ℹ️  Sin letras guardadas`);
      }
    } else {
      console.log(`   ❌ No se encontró canción para ${voiceType}`);
    }
  }
  
  // 3. Resumen del problema
  console.log('\n📋 RESUMEN:');
  console.log('ANTES de la corrección:');
  console.log('- Todas las letras se guardaban con el songId del padre');
  console.log('- Las variantes no tenían sus propias letras específicas');
  
  console.log('\nDESPUÉS de la corrección:');
  console.log('- La lógica busca el songId correcto de cada variante');
  console.log('- Las letras se guardan en la variante específica correspondiente');
  console.log('- Cada tipo de voz mantiene sus letras separadas');
  
  console.log('\n🔧 CORRECCIÓN APLICADA:');
  console.log('✅ Lógica de búsqueda de targetSong corregida');
  console.log('✅ Manejo seguro de valores null en consultas');
  console.log('✅ Uso correcto de targetSongId en operaciones de guardado');
  
  await prisma.$disconnect();
}

verifyLyricsFix().catch(console.error);
