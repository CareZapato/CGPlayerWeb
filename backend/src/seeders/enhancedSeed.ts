import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced seeding...');

  // Limpiar datos existentes (en orden correcto debido a relaciones)
  console.log('🧹 Cleaning existing data...');
  await prisma.soloist.deleteMany();
  await prisma.eventSong.deleteMany();
  await prisma.event.deleteMany();
  await prisma.lyric.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.songAssignment.deleteMany();
  await prisma.song.deleteMany();
  await prisma.userVoiceProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  // 1. Crear ubicaciones
  console.log('📍 Creating locations...');
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Iglesia Central Antofagasta',
        type: 'ANTOFAGASTA',
        address: 'Av. Pedro Aguirre Cerda 150',
        city: 'Antofagasta',
        region: 'Antofagasta',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia ChileGospel Viña del Mar',
        type: 'VINA_DEL_MAR',
        address: 'Calle Libertad 456',
        city: 'Viña del Mar',
        region: 'Valparaíso',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia Principal Santiago',
        type: 'SANTIAGO',
        address: 'Av. Providencia 2500',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia ChileGospel Concepción',
        type: 'CONCEPCION',
        address: 'Calle Barros Arana 100',
        city: 'Concepción',
        region: 'Biobío',
        country: 'Chile'
      }
    }),
    prisma.location.create({
      data: {
        name: 'Iglesia ChileGospel Valdivia',
        type: 'VALDIVIA',
        address: 'Av. Picarte 800',
        city: 'Valdivia',
        region: 'Los Ríos',
        country: 'Chile'
      }
    })
  ]);

  console.log(`✅ Created ${locations.length} locations`);

  // 2. Crear usuarios con ubicaciones asignadas
  console.log('👥 Creating users...');
  
  // Administrador
  const admin = await prisma.user.create({
    data: {
      email: 'admin@chilegospel.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Carlos',
      lastName: 'Administrador',
      role: 'ADMIN',
      locationId: locations[2].id // Santiago
    }
  });

  // Director Musical
  const director = await prisma.user.create({
    data: {
      email: 'director@chilegospel.com',
      username: 'director',
      password: await bcrypt.hash('director123', 10),
      firstName: 'María',
      lastName: 'Directora',
      role: 'DIRECTOR',
      locationId: locations[2].id // Santiago
    }
  });

  // Cantantes por ubicación
  const singers: any[] = [];
  const voiceTypes = ['SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONE', 'BASS'];
  const names = [
    { first: 'Ana', last: 'González' },
    { first: 'Luis', last: 'Martínez' },
    { first: 'Carmen', last: 'López' },
    { first: 'Pedro', last: 'Silva' },
    { first: 'Isabel', last: 'Torres' },
    { first: 'Miguel', last: 'Flores' },
    { first: 'Rosa', last: 'Hernández' },
    { first: 'Juan', last: 'Morales' },
    { first: 'Patricia', last: 'Vargas' },
    { first: 'Roberto', last: 'Castro' }
  ];

  for (let i = 0; i < 10; i++) {
    const locationIndex = i % locations.length;
    const voiceIndex = i % voiceTypes.length;
    
    const singer = await prisma.user.create({
      data: {
        email: `singer${i + 1}@chilegospel.com`,
        username: `singer${i + 1}`,
        password: await bcrypt.hash('singer123', 10),
        firstName: names[i].first,
        lastName: names[i].last,
        role: 'SINGER',
        locationId: locations[locationIndex].id
      }
    });

    // Crear perfil de voz
    await prisma.userVoiceProfile.create({
      data: {
        userId: singer.id,
        voiceType: voiceTypes[voiceIndex] as any,
        assignedBy: director.id
      }
    });

    singers.push(singer);
  }

  console.log(`✅ Created ${singers.length} singers + admin + director`);

  // 3. Crear canciones con versiones
  console.log('🎵 Creating songs...');
  
  const songTemplates = [
    { title: 'Amazing Grace', artist: 'Traditional', genre: 'Himno' },
    { title: 'How Great Thou Art', artist: 'Carl Boberg', genre: 'Adoración' },
    { title: 'Blessed Assurance', artist: 'Fanny Crosby', genre: 'Himno' },
    { title: 'Great Is Thy Faithfulness', artist: 'Thomas Chisholm', genre: 'Adoración' },
    { title: 'It Is Well', artist: 'Horatio Spafford', genre: 'Himno' }
  ];

  const allSongs: any[] = [];

  for (const template of songTemplates) {
    // Crear canción principal (versión original)
    const originalSong = await prisma.song.create({
      data: {
        title: template.title,
        artist: template.artist,
        genre: template.genre,
        duration: Math.floor(Math.random() * 180) + 120, // 2-5 minutos
        fileName: `${template.title.replace(/\s+/g, '_').toLowerCase()}_original.mp3`,
        filePath: `uploads/songs/${template.title.replace(/\s+/g, '_').toLowerCase()}_original.mp3`,
        fileSize: Math.floor(Math.random() * 10485760) + 5242880, // 5-15MB
        mimeType: 'audio/mpeg',
        voiceType: null, // Versión original
        parentSongId: null,
        uploadedBy: director.id
      }
    });

    allSongs.push(originalSong);

    // Crear versiones por tipo de voz
    for (const voiceType of voiceTypes) {
      const versionSong = await prisma.song.create({
        data: {
          title: `${template.title} (${voiceType})`,
          artist: template.artist,
          genre: template.genre,
          duration: originalSong.duration,
          fileName: `${template.title.replace(/\s+/g, '_').toLowerCase()}_${voiceType.toLowerCase()}.mp3`,
          filePath: `uploads/songs/${template.title.replace(/\s+/g, '_').toLowerCase()}_${voiceType.toLowerCase()}.mp3`,
          fileSize: originalSong.fileSize,
          mimeType: 'audio/mpeg',
          voiceType: voiceType as any,
          parentSongId: originalSong.id,
          uploadedBy: director.id
        }
      });

      allSongs.push(versionSong);
    }
  }

  console.log(`✅ Created ${allSongs.length} songs (${songTemplates.length} originals + versions)`);

  // 4. Crear eventos
  console.log('📅 Creating events...');
  
  const eventCategories = ['Culto', 'Ensayo', 'Presentación', 'Especial'];
  const events = [];

  // Eventos para diferentes ubicaciones
  for (let i = 0; i < 8; i++) {
    const locationIndex = i % locations.length;
    const categoryIndex = i % eventCategories.length;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (i * 7)); // Eventos semanales

    const event = await prisma.event.create({
      data: {
        title: `${eventCategories[categoryIndex]} - ${locations[locationIndex].name}`,
        description: `${eventCategories[categoryIndex]} programado en ${locations[locationIndex].city}`,
        date: futureDate,
        locationId: locations[locationIndex].id,
        category: eventCategories[categoryIndex]
      }
    });

    events.push(event);

    // Agregar canciones al evento (3-5 canciones por evento)
    const songsForEvent = allSongs.filter(song => !song.voiceType).slice(0, 3 + Math.floor(Math.random() * 3));
    
    for (let j = 0; j < songsForEvent.length; j++) {
      await prisma.eventSong.create({
        data: {
          eventId: event.id,
          songId: songsForEvent[j].id,
          order: j + 1,
          notes: j === 0 ? 'Canción de apertura' : j === songsForEvent.length - 1 ? 'Canción de cierre' : null
        }
      });
    }

    // Agregar solistas para algunos eventos
    if (categoryIndex === 2 || categoryIndex === 3) { // Presentación o Especial
      const eventSingers = singers.filter(singer => singer.locationId === locations[locationIndex].id);
      if (eventSingers.length > 0) {
        const randomSinger = eventSingers[Math.floor(Math.random() * eventSingers.length)];
        
        await prisma.soloist.create({
          data: {
            eventId: event.id,
            userId: randomSinger.id,
            songId: songsForEvent[0]?.id,
            soloistType: Math.random() > 0.5 ? 'BOTH' : (Math.random() > 0.5 ? 'MALE' : 'FEMALE'),
            notes: 'Solo especial para este evento'
          }
        });
      }
    }
  }

  console.log(`✅ Created ${events.length} events with songs and soloists`);

  // 5. Crear playlists
  console.log('🎵 Creating playlists...');
  
  // Playlist del director
  const directorPlaylist = await prisma.playlist.create({
    data: {
      name: 'Repertorio Principal',
      description: 'Canciones principales del coro',
      userId: director.id,
      isPublic: true
    }
  });

  // Agregar todas las canciones originales a la playlist del director
  const originalSongs = allSongs.filter(song => !song.voiceType);
  for (let i = 0; i < originalSongs.length; i++) {
    await prisma.playlistItem.create({
      data: {
        playlistId: directorPlaylist.id,
        songId: originalSongs[i].id,
        order: i + 1
      }
    });
  }

  // Playlists por tipo de voz para algunos cantantes
  const voicePlaylistPromises = voiceTypes.slice(0, 3).map(async (voiceType, index) => {
    const singer = singers[index];
    if (!singer) return;

    const playlist = await prisma.playlist.create({
      data: {
        name: `Mi Repertorio ${voiceType}`,
        description: `Canciones para ${voiceType}`,
        userId: singer.id,
        voiceType: voiceType as any,
        isPublic: false
      }
    });

    // Agregar canciones de ese tipo de voz
    const voiceSongs = allSongs.filter(song => song.voiceType === voiceType);
    for (let i = 0; i < Math.min(voiceSongs.length, 3); i++) {
      await prisma.playlistItem.create({
        data: {
          playlistId: playlist.id,
          songId: voiceSongs[i].id,
          order: i + 1
        }
      });
    }

    return playlist;
  });

  await Promise.all(voicePlaylistPromises);

  console.log('✅ Created playlists');

  // 6. Crear letras de ejemplo
  console.log('📝 Creating sample lyrics...');
  
  const sampleLyrics = [
    {
      content: "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now I'm found\nWas blind, but now I see",
      songTitle: 'Amazing Grace'
    },
    {
      content: "How great thou art, how great thou art\nThen sings my soul, my Savior God to thee\nHow great thou art, how great thou art",
      songTitle: 'How Great Thou Art'
    }
  ];

  for (const lyricData of sampleLyrics) {
    const song = allSongs.find(s => s.title === lyricData.songTitle && !s.voiceType);
    if (song) {
      await prisma.lyric.create({
        data: {
          songId: song.id,
          content: lyricData.content,
          createdBy: director.id
        }
      });
    }
  }

  console.log('✅ Created sample lyrics');

  // Mostrar resumen
  console.log('\n🎉 Enhanced seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👥 Users: ${singers.length + 2} (1 admin, 1 director, ${singers.length} singers)`);
  console.log(`📍 Locations: ${locations.length}`);
  console.log(`🎵 Songs: ${allSongs.length} (${songTemplates.length} originals + versions)`);
  console.log(`📅 Events: ${events.length}`);
  console.log(`🎼 Playlists: Created with voice-specific repertoires`);
  
  console.log('\n🔑 Login credentials:');
  console.log('Admin: admin@chilegospel.com / admin123');
  console.log('Director: director@chilegospel.com / director123');
  console.log('Singers: singer1@chilegospel.com / singer123 (etc.)');
  
  console.log('\n🌍 Locations created:');
  locations.forEach(loc => {
    console.log(`- ${loc.name} (${loc.city})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
