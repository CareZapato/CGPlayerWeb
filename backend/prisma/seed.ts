import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cgplayer.com' },
    update: {},
    create: {
      email: 'admin@cgplayer.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'Sistema',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // Crear usuario cantante
  const singerPassword = await bcrypt.hash('singer123', 10);
  
  const singer = await prisma.user.upsert({
    where: { email: 'singer@cgplayer.com' },
    update: {},
    create: {
      email: 'singer@cgplayer.com',
      username: 'singer',
      firstName: 'Cantante',
      lastName: 'Ejemplo',
      password: singerPassword,
      role: 'SINGER'
    }
  });

  // Crear canciones principales con sus variaciones

  // 1. "You Raise Me Up" con sus variaciones
  const youRaiseMeUp = await prisma.song.create({
    data: {
      title: 'You Raise Me Up',
      artist: 'Josh Groban',
      duration: 322,
      fileName: 'you-raise-me-up-soprano.mp3',
      filePath: '/uploads/you-raise-me-up-soprano.mp3',
      fileSize: 6440000,
      mimeType: 'audio/mpeg',
      folderName: 'You Raise Me Up',
      voiceType: 'SOPRANO',
      uploadedBy: singer.id,
      coverColor: '#FF69B4'
    }
  });

  // Variaciones de "You Raise Me Up"
  await prisma.song.create({
    data: {
      title: 'You Raise Me Up',
      artist: 'Josh Groban',
      duration: 320,
      fileName: 'you-raise-me-up-contralto.mp3',
      filePath: '/uploads/you-raise-me-up-contralto.mp3',
      fileSize: 6400000,
      mimeType: 'audio/mpeg',
      folderName: 'You Raise Me Up',
      voiceType: 'CONTRALTO',
      parentSongId: youRaiseMeUp.id,
      uploadedBy: singer.id,
      coverColor: '#FF69B4'
    }
  });

  await prisma.song.create({
    data: {
      title: 'You Raise Me Up',
      artist: 'Josh Groban',
      duration: 318,
      fileName: 'you-raise-me-up-tenor.mp3',
      filePath: '/uploads/you-raise-me-up-tenor.mp3',
      fileSize: 6350000,
      mimeType: 'audio/mpeg',
      folderName: 'You Raise Me Up',
      voiceType: 'TENOR',
      parentSongId: youRaiseMeUp.id,
      uploadedBy: singer.id,
      coverColor: '#FF69B4'
    }
  });

  // 2. "Amazing Grace" con sus variaciones
  const amazingGrace = await prisma.song.create({
    data: {
      title: 'Amazing Grace',
      artist: 'Tradicional',
      duration: 240,
      fileName: 'amazing-grace-soprano.mp3',
      filePath: '/uploads/amazing-grace-soprano.mp3',
      fileSize: 4800000,
      mimeType: 'audio/mpeg',
      folderName: 'Amazing Grace',
      voiceType: 'SOPRANO',
      uploadedBy: singer.id,
      coverColor: '#4ECDC4'
    }
  });

  await prisma.song.create({
    data: {
      title: 'Amazing Grace',
      artist: 'Tradicional',
      duration: 242,
      fileName: 'amazing-grace-baritone.mp3',
      filePath: '/uploads/amazing-grace-baritone.mp3',
      fileSize: 4840000,
      mimeType: 'audio/mpeg',
      folderName: 'Amazing Grace',
      voiceType: 'BARITONE',
      parentSongId: amazingGrace.id,
      uploadedBy: singer.id,
      coverColor: '#4ECDC4'
    }
  });

  // 3. "How Great Thou Art" con variaciones
  const howGreatThouArt = await prisma.song.create({
    data: {
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      duration: 320,
      fileName: 'how-great-thou-art-soprano.mp3',
      filePath: '/uploads/how-great-thou-art-soprano.mp3',
      fileSize: 6400000,
      mimeType: 'audio/mpeg',
      folderName: 'How Great Thou Art',
      voiceType: 'SOPRANO',
      uploadedBy: singer.id,
      coverColor: '#45B7D1'
    }
  });

  await prisma.song.create({
    data: {
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      duration: 315,
      fileName: 'how-great-thou-art-bass.mp3',
      filePath: '/uploads/how-great-thou-art-bass.mp3',
      fileSize: 6300000,
      mimeType: 'audio/mpeg',
      folderName: 'How Great Thou Art',
      voiceType: 'BASS',
      parentSongId: howGreatThouArt.id,
      uploadedBy: singer.id,
      coverColor: '#45B7D1'
    }
  });

  // 4. "Blessed Assurance" - canción individual
  await prisma.song.create({
    data: {
      title: 'Blessed Assurance',
      artist: 'Fanny Crosby',
      duration: 280,
      fileName: 'blessed-assurance-soprano.mp3',
      filePath: '/uploads/blessed-assurance-soprano.mp3',
      fileSize: 5600000,
      mimeType: 'audio/mpeg',
      folderName: 'Blessed Assurance',
      voiceType: 'SOPRANO',
      uploadedBy: singer.id,
      coverColor: '#96CEB4'
    }
  });

  // Crear ubicación
  const location1 = await prisma.location.create({
    data: {
      name: 'Iglesia Central Santiago',
      type: 'SANTIAGO',
      address: 'Av. Principal 123',
      city: 'Santiago',
      region: 'Metropolitana'
    }
  });

  // Crear evento
  await prisma.event.create({
    data: {
      title: 'Concierto de Navidad',
      description: 'Celebración navideña con coros y música especial',
      date: new Date('2025-12-24T19:00:00Z'),
      locationId: location1.id,
      category: 'Especial'
    }
  });

  console.log('✅ Datos de ejemplo creados exitosamente');
  console.log('📧 Admin: admin@cgplayer.com | Contraseña: admin123');
  console.log('🎤 Cantante: singer@cgplayer.com | Contraseña: singer123');
  console.log('🎵 Canciones principales creadas: 4');
  console.log('   - You Raise Me Up (3 variaciones: Soprano, Contralto, Tenor)');
  console.log('   - Amazing Grace (2 variaciones: Soprano, Barítono)');
  console.log('   - How Great Thou Art (2 variaciones: Soprano, Bajo)');
  console.log('   - Blessed Assurance (1 variación: Soprano)');
  console.log('🎶 Total de archivos de audio: 7');
  console.log('📍 Ubicaciones creadas: 1');
  console.log('📅 Eventos creados: 1');
}

main()
  .catch((e) => {
    console.error('❌ Error al crear datos de ejemplo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
