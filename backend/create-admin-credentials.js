const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminWithValidCredentials() {
  try {
    console.log('🔐 Creando administrador con credenciales válidas...\n');

    // Limpiar datos anteriores
    console.log('🗑️  Limpiando datos anteriores...');
    await prisma.eventAttendee.deleteMany();
    await prisma.eventJoinRequest.deleteMany();
    await prisma.eventSong.deleteMany();
    await prisma.eventPlaylist.deleteMany();
    await prisma.playlistItem.deleteMany();
    await prisma.playlist.deleteMany();
    await prisma.lyric.deleteMany();
    await prisma.lyricsFile.deleteMany();
    await prisma.songAssignment.deleteMany();
    await prisma.soloist.deleteMany();
    await prisma.song.deleteMany();
    await prisma.eventAttendance.deleteMany();
    await prisma.event.deleteMany();
    await prisma.userVoiceProfile.deleteMany();
    await prisma.userRole_DB.deleteMany();
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();

    // Crear ubicaciones
    const location = await prisma.location.create({
      data: {
        name: 'Catedral Santiago',
        type: 'SANTIAGO',
        address: 'Plaza de Armas s/n',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile',
        color: '#FF6B6B'
      }
    });

    console.log('✅ Ubicación creada:', location.name);

    // Generar password hash válido
    const plainPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    console.log(`🔑 Password generado: "${plainPassword}"`);
    console.log(`🔐 Hash generado: ${hashedPassword.substring(0, 30)}...`);

    // Crear usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        locationId: location.id,
        phone: '+56912345678',
        isActive: true
      }
    });

    console.log('✅ Usuario administrador creado:', {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName
    });

    // Asignar rol de administrador
    const adminRole = await prisma.userRole_DB.create({
      data: {
        userId: adminUser.id,
        role: 'ADMIN',
        assignedBy: adminUser.id
      }
    });

    console.log('✅ Rol de administrador asignado:', adminRole.role);

    // Asignar voz primaria al admin
    const adminVoice = await prisma.userVoiceProfile.create({
      data: {
        userId: adminUser.id,
        voiceType: 'BARITONO',
        isPrimary: true,
        assignedBy: adminUser.id
      }
    });

    console.log('✅ Voz primaria asignada:', adminVoice.voiceType);

    // Verificar que el usuario se puede autenticar
    const storedUser = await prisma.user.findUnique({
      where: { email: 'admin@cgplayer.com' },
      include: {
        roles: true,
        voiceProfiles: true,
        location: true
      }
    });

    if (storedUser) {
      const passwordMatch = await bcrypt.compare(plainPassword, storedUser.password);
      console.log('✅ Verificación de password:', passwordMatch ? 'EXITOSA' : 'FALLIDA');
      
      console.log('\n📋 DATOS DEL USUARIO CREADO:');
      console.log('Email:', storedUser.email);
      console.log('Username:', storedUser.username);
      console.log('Roles:', storedUser.roles.map(r => r.role));
      console.log('Voces:', storedUser.voiceProfiles.map(v => `${v.voiceType}${v.isPrimary ? ' (Primaria)' : ''}`));
      console.log('Ubicación:', storedUser.location?.name);
      console.log('Activo:', storedUser.isActive);
    }

    console.log('\n🎉 Administrador creado exitosamente!');
    console.log('\n🔑 CREDENCIALES PARA LOGIN:');
    console.log('═══════════════════════════════');
    console.log('📧 Email: admin@cgplayer.com');
    console.log('👤 Username: admin');
    console.log('🔒 Password: admin123');
    console.log('═══════════════════════════════');

  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createAdminWithValidCredentials()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  });
