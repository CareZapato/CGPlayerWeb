const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking current database state...\n');
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('Existing users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
    });
    
    // Check songs
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        artist: true
      }
    });
    
    console.log('\nExisting songs:', songs.length);
    songs.forEach(song => {
      console.log(`- ${song.title} by ${song.artist || 'Unknown'}`);
    });
    
    // Check voice profiles
    const voiceProfiles = await prisma.userVoiceProfile.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    console.log('\nExisting voice profiles:', voiceProfiles.length);
    voiceProfiles.forEach(profile => {
      console.log(`- ${profile.user.username}: ${profile.voiceType}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
