import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. Administrador
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chilegospel.com' },
    update: {},
    create: {
      email: 'admin@chilegospel.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'González',
      role: 'ADMIN',
      isActive: true
    }
  });

  // 2. Director
  const director = await prisma.user.upsert({
    where: { email: 'director@chilegospel.com' },
    update: {},
    create: {
      email: 'director@chilegospel.com',
      username: 'director',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: 'DIRECTOR',
      isActive: true
    }
  });

  // 3. Cantantes (5 miembros)
  const singers = [
    {
      email: 'ana.soprano@chilegospel.com',
      username: 'ana_soprano',
      firstName: 'Ana',
      lastName: 'Martínez',
      voices: ['SOPRANO']
    },
    {
      email: 'lucia.contralto@chilegospel.com',
      username: 'lucia_contralto',
      firstName: 'Lucía',
      lastName: 'Silva',
      voices: ['CONTRALTO']
    },
    {
      email: 'pedro.tenor@chilegospel.com',
      username: 'pedro_tenor',
      firstName: 'Pedro',
      lastName: 'López',
      voices: ['TENOR']
    },
    {
      email: 'jose.baritone@chilegospel.com',
      username: 'jose_baritone',
      firstName: 'José',
      lastName: 'Fernández',
      voices: ['BARITONE']
    },
    {
      email: 'miguel.bass@chilegospel.com',
      username: 'miguel_bass',
      firstName: 'Miguel',
      lastName: 'Torres',
      voices: ['BASS']
    }
  ];

  const createdSingers = [];
  for (const singerData of singers) {
    const singer = await prisma.user.upsert({
      where: { email: singerData.email },
      update: {},
      create: {
        email: singerData.email,
        username: singerData.username,
        password: hashedPassword,
        firstName: singerData.firstName,
        lastName: singerData.lastName,
        role: 'SINGER',
        isActive: true
      }
    });
    createdSingers.push({ ...singer, voices: singerData.voices });
  }

  // Asignar tipos de voz a los cantantes
  for (const singer of createdSingers) {
    for (const voiceType of singer.voices) {
      await prisma.userVoiceProfile.upsert({
        where: {
          userId_voiceType: {
            userId: singer.id,
            voiceType: voiceType as any
          }
        },
        update: {},
        create: {
          userId: singer.id,
          voiceType: voiceType as any,
          assignedBy: admin.id
        }
      });
    }
  }

  // Crear canciones de ejemplo
  const songs = [
    {
      title: 'Amazing Grace',
      artist: 'Traditional',
      genre: 'Gospel',
      description: 'Himno clásico del gospel',
      versions: [
        { voiceType: null, fileName: 'amazing_grace_original.mp3' },
        { voiceType: 'SOPRANO', fileName: 'amazing_grace_soprano.mp3' },
        { voiceType: 'CONTRALTO', fileName: 'amazing_grace_contralto.mp3' },
        { voiceType: 'TENOR', fileName: 'amazing_grace_tenor.mp3' },
        { voiceType: 'BARITONE', fileName: 'amazing_grace_baritone.mp3' }
      ]
    },
    {
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      genre: 'Gospel',
      description: 'Himno de adoración',
      versions: [
        { voiceType: null, fileName: 'how_great_thou_art_original.mp3' },
        { voiceType: 'SOPRANO', fileName: 'how_great_thou_art_soprano.mp3' },
        { voiceType: 'TENOR', fileName: 'how_great_thou_art_tenor.mp3' },
        { voiceType: 'BASS', fileName: 'how_great_thou_art_bass.mp3' }
      ]
    },
    {
      title: 'Blessed Assurance',
      artist: 'Fanny Crosby',
      genre: 'Gospel',
      description: 'Himno de seguridad en Cristo',
      versions: [
        { voiceType: null, fileName: 'blessed_assurance_original.mp3' },
        { voiceType: 'CONTRALTO', fileName: 'blessed_assurance_contralto.mp3' },
        { voiceType: 'BARITONE', fileName: 'blessed_assurance_baritone.mp3' }
      ]
    }
  ];

  for (const songData of songs) {
    // Crear la canción principal (versión original)
    const originalVersion = songData.versions.find(v => v.voiceType === null);
    const song = await prisma.song.create({
      data: {
        title: songData.title,
        artist: songData.artist,
        genre: songData.genre,
        fileName: originalVersion!.fileName,
        filePath: `uploads/songs/${originalVersion!.fileName}`,
        fileSize: 5242880, // 5MB simulado
        mimeType: 'audio/mpeg',
        duration: 180, // 3 minutos simulado
        uploadedBy: director.id,
        isActive: true
      }
    });

    // Crear las versiones por voz
    for (const version of songData.versions) {
      if (version.voiceType) {
        await prisma.song.create({
          data: {
            title: `${songData.title} (${version.voiceType})`,
            artist: songData.artist,
            genre: songData.genre,
            fileName: version.fileName,
            filePath: `uploads/songs/${version.fileName}`,
            fileSize: 5242880,
            mimeType: 'audio/mpeg',
            duration: 180,
            uploadedBy: director.id,
            isActive: true,
            voiceType: version.voiceType as any,
            parentSongId: song.id // Relacionar con la canción original
          }
        });
      }
    }
  }

  // Crear playlists de ejemplo
  const sopranoPlaylist = await prisma.playlist.create({
    data: {
      name: 'Repertorio Soprano',
      description: 'Canciones para voces soprano',
      voiceType: 'SOPRANO',
      isPublic: true,
      userId: director.id
    }
  });

  const tenorPlaylist = await prisma.playlist.create({
    data: {
      name: 'Repertorio Tenor',
      description: 'Canciones para voces tenor',
      voiceType: 'TENOR',
      isPublic: true,
      userId: director.id
    }
  });

  // Agregar canciones a las playlists
  const sopranoSongs = await prisma.song.findMany({
    where: {
      OR: [
        { voiceType: 'SOPRANO' },
        { voiceType: null } // Versiones originales
      ]
    },
    take: 3
  });

  for (let i = 0; i < sopranoSongs.length; i++) {
    await prisma.playlistItem.create({
      data: {
        playlistId: sopranoPlaylist.id,
        songId: sopranoSongs[i].id,
        order: i + 1
      }
    });
  }

  console.log('✅ Seeding completado!');
  console.log('\n📋 Usuarios creados:');
  console.log('👑 Admin: admin@chilegospel.com / 123456');
  console.log('🎭 Director: director@chilegospel.com / 123456');
  console.log('🎤 Cantantes:');
  console.log('   - Ana (Soprano): ana.soprano@chilegospel.com / 123456');
  console.log('   - Lucía (Contralto): lucia.contralto@chilegospel.com / 123456');
  console.log('   - Pedro (Tenor): pedro.tenor@chilegospel.com / 123456');
  console.log('   - José (Barítono): jose.baritone@chilegospel.com / 123456');
  console.log('   - Miguel (Bajo): miguel.bass@chilegospel.com / 123456');
  console.log('\n🎵 Se crearon canciones de ejemplo con múltiples versiones por voz');
  console.log('📝 Se crearon playlists organizadas por tipo de voz');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
