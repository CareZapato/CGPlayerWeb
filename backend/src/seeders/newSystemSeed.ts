/**
 * @deprecated Este seeder está deprecado. 
 * Usar prisma/seed_new.ts para la inicialización completa del sistema con 152 usuarios.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Definir cantantes con variedad de voces
const singers = [
  { firstName: 'María', lastName: 'González', email: 'maria.gonzalez@cgplayer.com', voices: ['SOPRANO'] },
  { firstName: 'Ana', lastName: 'Rodríguez', email: 'ana.rodriguez@cgplayer.com', voices: ['SOPRANO', 'CORO'] },
  { firstName: 'Carmen', lastName: 'López', email: 'carmen.lopez@cgplayer.com', voices: ['CONTRALTO'] },
  { firstName: 'Isabel', lastName: 'Martín', email: 'isabel.martin@cgplayer.com', voices: ['CONTRALTO', 'CORO'] },
  { firstName: 'Patricia', lastName: 'Sánchez', email: 'patricia.sanchez@cgplayer.com', voices: ['MESOSOPRANO'] },
  { firstName: 'Laura', lastName: 'Pérez', email: 'laura.perez@cgplayer.com', voices: ['MESOSOPRANO', 'SOPRANO'] },
  { firstName: 'Carlos', lastName: 'García', email: 'carlos.garcia@cgplayer.com', voices: ['TENOR'] },
  { firstName: 'Miguel', lastName: 'Hernández', email: 'miguel.hernandez@cgplayer.com', voices: ['TENOR', 'CORO'] },
  { firstName: 'José', lastName: 'Jiménez', email: 'jose.jimenez@cgplayer.com', voices: ['TENOR', 'BARITONO'] },
  { firstName: 'Antonio', lastName: 'Ruiz', email: 'antonio.ruiz@cgplayer.com', voices: ['BARITONO'] },
  { firstName: 'Francisco', lastName: 'Moreno', email: 'francisco.moreno@cgplayer.com', voices: ['BARITONO', 'CORO'] },
  { firstName: 'David', lastName: 'Muñoz', email: 'david.munoz@cgplayer.com', voices: ['BAJO'] },
  { firstName: 'Daniel', lastName: 'Álvarez', email: 'daniel.alvarez@cgplayer.com', voices: ['BAJO', 'CORO'] },
  { firstName: 'Rafael', lastName: 'Romero', email: 'rafael.romero@cgplayer.com', voices: ['BAJO', 'BARITONO'] },
  { firstName: 'Lucía', lastName: 'Torres', email: 'lucia.torres@cgplayer.com', voices: ['SOPRANO', 'MESOSOPRANO'] },
  { firstName: 'Elena', lastName: 'Flores', email: 'elena.flores@cgplayer.com', voices: ['CONTRALTO', 'MESOSOPRANO'] },
  { firstName: 'Beatriz', lastName: 'Vargas', email: 'beatriz.vargas@cgplayer.com', voices: ['CORO'] },
  { firstName: 'Roberto', lastName: 'Castro', email: 'roberto.castro@cgplayer.com', voices: ['TENOR', 'CORO'] },
  { firstName: 'Javier', lastName: 'Ortega', email: 'javier.ortega@cgplayer.com', voices: ['BARITONO', 'BAJO'] },
  { firstName: 'Andrea', lastName: 'Ramos', email: 'andrea.ramos@cgplayer.com', voices: ['SOPRANO', 'CORO'] }
];

// Función para obtener archivos de canciones existentes
function getExistingSongs() {
  const songsDir = path.join(__dirname, '../../../Songs');
  
  if (!fs.existsSync(songsDir)) {
    console.log('📁 No se encontró la carpeta Songs, saltando la inicialización de canciones');
    return [];
  }

  const songs: any[] = [];
  
  try {
    const folders = fs.readdirSync(songsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    folders.forEach(folderName => {
      const folderPath = path.join(songsDir, folderName);
      const files = fs.readdirSync(folderPath)
        .filter(file => file.match(/\.(mp3|wav|ogg|m4a)$/i));

      files.forEach(fileName => {
        const filePath = path.join(folderPath, fileName);
        const stats = fs.statSync(filePath);
        
        // Detectar tipo de voz basado en el nombre del archivo
        let voiceType: string | null = null;
        const fileNameLower = fileName.toLowerCase();
        
        if (fileNameLower.includes('soprano')) voiceType = 'SOPRANO';
        else if (fileNameLower.includes('contralto')) voiceType = 'CONTRALTO';
        else if (fileNameLower.includes('tenor')) voiceType = 'TENOR';
        else if (fileNameLower.includes('baritono') || fileNameLower.includes('baritone')) voiceType = 'BARITONO';
        else if (fileNameLower.includes('bajo') || fileNameLower.includes('bass')) voiceType = 'BAJO';
        else if (fileNameLower.includes('mezzosoprano') || fileNameLower.includes('mesosoprano')) voiceType = 'MESOSOPRANO';
        else if (fileNameLower.includes('coro') || fileNameLower.includes('choir')) voiceType = 'CORO';

        songs.push({
          title: folderName,
          fileName,
          folderName,
          filePath: `${folderName}/${fileName}`,
          fileSize: stats.size,
          voiceType,
          mimeType: fileName.endsWith('.mp3') ? 'audio/mpeg' : 
                   fileName.endsWith('.wav') ? 'audio/wav' :
                   fileName.endsWith('.ogg') ? 'audio/ogg' : 'audio/mp4'
        });
      });
    });

    console.log(`🎵 Encontradas ${songs.length} canciones en ${folders.length} carpetas`);
    return songs;
  } catch (error) {
    console.error('Error al escanear canciones:', error);
    return [];
  }
}

async function cleanDatabase() {
  console.log('🧹 Limpiando base de datos...');
  
  try {
    // Eliminar en orden para evitar errores de FK
    await prisma.playlistItem.deleteMany();
    await prisma.playlist.deleteMany();
    await prisma.songAssignment.deleteMany();
    await prisma.eventSong.deleteMany();
    await prisma.event.deleteMany();
    await prisma.lyric.deleteMany();
    await prisma.soloist.deleteMany();
    await prisma.song.deleteMany();
    await prisma.userVoiceProfile.deleteMany();
    await prisma.$executeRaw`DELETE FROM user_roles`;
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();
    
    console.log('✅ Base de datos limpiada');
  } catch (error) {
    console.log('⚠️  Error limpiando BD (normal en primera ejecución):', error);
  }
}

async function createLocations() {
  console.log('📍 Creando ubicaciones...');
  
  const locations = [
    { name: 'Antofagasta', type: 'ANTOFAGASTA' as any, city: 'Antofagasta' },
    { name: 'Viña del Mar', type: 'VINA_DEL_MAR' as any, city: 'Viña del Mar' },
    { name: 'Santiago', type: 'SANTIAGO' as any, city: 'Santiago' },
    { name: 'Concepción', type: 'CONCEPCION' as any, city: 'Concepción' },
    { name: 'Valdivia', type: 'VALDIVIA' as any, city: 'Valdivia' }
  ];

  const createdLocations: any[] = [];
  for (const location of locations) {
    const created = await prisma.location.create({
      data: location
    });
    createdLocations.push(created);
  }
  
  console.log(`✅ Creadas ${createdLocations.length} ubicaciones`);
  return createdLocations;
}

async function createUsers(locations: any[]) {
  console.log('� Creando usuarios...');
  
  const users: any[] = [];
  
  // Crear admin
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cgplayer.com',
      username: 'admin',
      password: hashedAdminPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      locationId: randomLocation.id,
      isActive: true
    }
  });

  // Asignar rol ADMIN usando SQL raw
  await prisma.$executeRaw`
    INSERT INTO user_roles (id, "userId", role, "createdAt")
    VALUES (gen_random_uuid(), ${admin.id}, 'ADMIN', NOW())
  `;

  users.push({ ...admin, userType: 'ADMIN' });

  // Crear cantantes
  for (const singer of singers) {
    const hashedPassword = await bcrypt.hash('cantante123', 10);
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    const user = await prisma.user.create({
      data: {
        email: singer.email,
        username: singer.email.split('@')[0],
        password: hashedPassword,
        firstName: singer.firstName,
        lastName: singer.lastName,
        locationId: randomLocation.id,
        isActive: true
      }
    });

    // Asignar rol CANTANTE usando SQL raw
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${user.id}, 'CANTANTE', NOW())
    `;

    users.push({ 
      ...user, 
      userType: 'CANTANTE',
      voices: singer.voices
    });
  }
  
  console.log(`✅ Creados ${users.length} usuarios (1 admin + ${singers.length} cantantes)`);
  return users;
}

async function main() {
  try {
    console.log('🚀 Iniciando seed básico...');
    
    // 1. Limpiar base de datos
    await cleanDatabase();

    // 2. Crear ubicaciones
    const locations = await createLocations();

    // 3. Crear usuarios
    const users = await createUsers(locations);

    // 4. Obtener canciones existentes
    const existingSongs = getExistingSongs();
    console.log(`📁 Encontradas ${existingSongs.length} canciones para agregar`);

    console.log('\n🎉 ¡Seed básico completado!');
    console.log('📊 Resumen:');
    console.log(`   - ${users.length} usuarios creados`);
    console.log(`   - ${locations.length} ubicaciones`);
    console.log(`   - ${existingSongs.length} canciones disponibles`);
    console.log('\n🔑 Credenciales:');
    console.log('   Admin: admin@cgplayer.com / admin123');
    console.log('   Cantantes: [email] / cantante123');
    console.log('\n⚠️  NOTA: Después de aplicar las migraciones de Prisma,');
    console.log('   ejecuta el seeder completo para roles y voces.');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
