import { PrismaClient, VoiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSongsWithFiles() {
  console.log('🎵 Seeding only songs with real audio files...\n');

  try {
    // Verificar si ya existen canciones
    const existingSongs = await prisma.song.count();
    if (existingSongs > 0) {
      console.log('⚠️ Ya existen canciones en la base de datos. Este seed solo debe ejecutarse en una BD vacía.');
      console.log('Si quieres resetear completamente, usa el script reset-db.ts primero.');
      return;
    }

    // 1. I Will Follow Him - ChileGospel
    console.log('📀 Creando: I Will Follow Him');
    const iWillFollowHim = await prisma.song.create({
      data: {
        title: 'I Will Follow Him',
        artist: 'ChileGospel',
        album: 'ChileGospel Collection',
        duration: 180,
        filePath: 'songs/i_will_follow_him_1755576704986',
        fileName: 'i_will_follow_him.m4a',
        fileSize: 5000000,
        mimeType: 'audio/mp4',
        uploadedBy: 'cmehzlge00000urcqmvl3jff7', // admin user
        isActive: true,
      }
    });

    // Versiones de I Will Follow Him
    const iWillFollowHimVersions = [
      { voiceType: 'CONTRALTO' as VoiceType, filePath: 'songs\\i_will_follow_him_1755576704986\\i_will_follow_him_contralto.m4a', fileName: 'i_will_follow_him_contralto.m4a' },
      { voiceType: 'SOPRANO' as VoiceType, filePath: 'songs\\i_will_follow_him_1755576704986\\i_will_follow_him_soprano.m4a', fileName: 'i_will_follow_him_soprano.m4a' },
      { voiceType: 'TENOR' as VoiceType, filePath: 'songs\\i_will_follow_him_1755576704986\\i_will_follow_him_tenor.m4a', fileName: 'i_will_follow_him_tenor.m4a' }
    ];

    for (const version of iWillFollowHimVersions) {
      await prisma.song.create({
        data: {
          title: `I Will Follow Him (${version.voiceType})`,
          artist: 'ChileGospel',
          album: 'ChileGospel Collection',
          duration: 180,
          filePath: version.filePath,
          fileName: version.fileName,
          fileSize: 4500000,
          mimeType: 'audio/mp4',
          voiceType: version.voiceType,
          parentSongId: iWillFollowHim.id,
          uploadedBy: 'cmehzlge00000urcqmvl3jff7',
          isActive: true,
        }
      });
    }
    console.log('  ✅ 3 versiones creadas');

    // 2. Jesus Promised He'll Take Care of Me - ChileGospel
    console.log('📀 Creando: Jesus Promised He\'ll Take Care of Me');
    const jesusPromised = await prisma.song.create({
      data: {
        title: 'Jesus Promised He\'ll take care of me',
        artist: 'ChileGospel',
        album: 'ChileGospel Collection',
        duration: 240,
        filePath: 'songs/jesus_promised_he_ll_take_care_of_me_1755576764973',
        fileName: 'jesus_promised_he_ll_take_care_of_me.mp3',
        fileSize: 6000000,
        mimeType: 'audio/mpeg',
        uploadedBy: 'cmehzlge00000urcqmvl3jff7',
        isActive: true,
      }
    });

    // Versiones de Jesus Promised
    const jesusPromisedVersions = [
      { voiceType: 'ORIGINAL' as VoiceType, filePath: 'songs\\jesus_promised_he_ll_take_care_of_me_1755576764973\\jesus_promised_he_ll_take_care_of_me.mp3', fileName: 'jesus_promised_he_ll_take_care_of_me.mp3' },
      { voiceType: 'SOPRANO' as VoiceType, filePath: 'songs\\jesus_promised_he_ll_take_care_of_me_1755576764973\\jesus_promised_he_ll_take_care_of_me_soprano.mp3', fileName: 'jesus_promised_he_ll_take_care_of_me_soprano.mp3' },
      { voiceType: 'TENOR' as VoiceType, filePath: 'songs\\jesus_promised_he_ll_take_care_of_me_1755576764973\\jesus_promised_he_ll_take_care_of_me_tenor.mp3', fileName: 'jesus_promised_he_ll_take_care_of_me_tenor.mp3' }
    ];

    for (const version of jesusPromisedVersions) {
      await prisma.song.create({
        data: {
          title: `Jesus Promised He'll take care of me (${version.voiceType})`,
          artist: 'ChileGospel',
          album: 'ChileGospel Collection',
          duration: 240,
          filePath: version.filePath,
          fileName: version.fileName,
          fileSize: 5500000,
          mimeType: 'audio/mpeg',
          voiceType: version.voiceType,
          parentSongId: jesusPromised.id,
          uploadedBy: 'cmehzlge00000urcqmvl3jff7',
          isActive: true,
        }
      });
    }
    console.log('  ✅ 3 versiones creadas');

    // 3. You Raise Me Up - ChileGospel
    console.log('📀 Creando: You Raise Me Up');
    const youRaiseMeUp = await prisma.song.create({
      data: {
        title: 'You Raise Me Up',
        artist: 'ChileGospel',
        album: 'ChileGospel Collection',
        duration: 210,
        filePath: 'songs/you_raise_me_up_1755575203125',
        fileName: 'you_raise_me_up.m4a',
        fileSize: 5200000,
        mimeType: 'audio/mp4',
        uploadedBy: 'cmehzlge00000urcqmvl3jff7',
        isActive: true,
      }
    });

    // Versiones de You Raise Me Up
    const youRaiseMeUpVersions = [
      { voiceType: 'CONTRALTO' as VoiceType, filePath: 'songs\\you_raise_me_up_1755575203125\\you_raise_me_up_contralto.m4a', fileName: 'you_raise_me_up_contralto.m4a' },
      { voiceType: 'SOPRANO' as VoiceType, filePath: 'songs\\you_raise_me_up_1755575203125\\you_raise_me_up_soprano.m4a', fileName: 'you_raise_me_up_soprano.m4a' },
      { voiceType: 'TENOR' as VoiceType, filePath: 'songs\\you_raise_me_up_1755575203125\\you_raise_me_up_tenor.m4a', fileName: 'you_raise_me_up_tenor.m4a' }
    ];

    for (const version of youRaiseMeUpVersions) {
      await prisma.song.create({
        data: {
          title: `You Raise Me Up (${version.voiceType})`,
          artist: 'ChileGospel',
          album: 'ChileGospel Collection',
          duration: 210,
          filePath: version.filePath,
          fileName: version.fileName,
          fileSize: 4800000,
          mimeType: 'audio/mp4',
          voiceType: version.voiceType,
          parentSongId: youRaiseMeUp.id,
          uploadedBy: 'cmehzlge00000urcqmvl3jff7',
          isActive: true,
        }
      });
    }
    console.log('  ✅ 3 versiones creadas');

    console.log('\n🎉 Seed de canciones completado!');
    console.log('📊 Resumen:');
    console.log('  - 3 canciones principales');
    console.log('  - 9 versiones por tipo de voz');
    console.log('  - Total: 12 registros de canciones');
    console.log('\nTodas las canciones tienen archivos de audio reales en el sistema.');

  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSongsWithFiles();
