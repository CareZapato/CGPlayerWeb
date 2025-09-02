const { PrismaClient } = require('@prisma/client');

async function testLyricsFile() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Probando acceso a lyricsFile...');
    const count = await prisma.lyricsFile.count();
    console.log(`Número de archivos de lyrics: ${count}`);
    
    console.log('✅ lyricsFile funciona correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLyricsFile();
