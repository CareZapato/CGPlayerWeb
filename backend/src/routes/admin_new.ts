import express, { Request, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Datos para seed
const nombres = [
  // Nombres femeninos tradicionales
  'María', 'Carmen', 'Josefa', 'Isabel', 'Ana', 'Francisca', 'Dolores', 'Antonia', 'Pilar', 'Teresa',
  'Rosa', 'Concepción', 'Mercedes', 'Esperanza', 'Amparo', 'Soledad', 'Remedios', 'Milagros', 'Encarnación', 'Asunción',
  'Cristina', 'Elena', 'Patricia', 'Laura', 'Mónica', 'Sandra', 'Beatriz', 'Rocío', 'Silvia', 'Nuria',
  // Nombres femeninos modernos
  'Lucía', 'Paula', 'Claudia', 'Andrea', 'Sofía', 'Valentina', 'Martina', 'Catalina', 'Fernanda', 'Javiera',
  'Camila', 'Florencia', 'Constanza', 'Maite', 'Ignacia', 'Emilia', 'Agustina', 'Isidora', 'Amparo', 'Esperanza',
  'Bárbara', 'Carla', 'Daniela', 'Gabriela', 'Alejandra', 'Natalia', 'Vanessa', 'Verónica', 'Carolina', 'Lorena',
  // Nombres masculinos tradicionales
  'José', 'Antonio', 'Manuel', 'Francisco', 'Juan', 'David', 'José Antonio', 'José Luis', 'Jesús', 'Javier',
  'Carlos', 'Miguel', 'Rafael', 'Pedro', 'Daniel', 'Fernando', 'Alejandro', 'Sergio', 'Pablo', 'Jorge',
  'Alberto', 'Luis', 'Álvaro', 'Roberto', 'Adrián', 'Óscar', 'Raúl', 'Rubén', 'Iván', 'Gonzalo',
  // Nombres masculinos modernos
  'Sebastián', 'Matías', 'Nicolás', 'Benjamín', 'Vicente', 'Tomás', 'Maximiliano', 'Cristóbal', 'Joaquín', 'Martín',
  'Felipe', 'Diego', 'Andrés', 'Eduardo', 'Ricardo', 'Patricio', 'Rodrigo', 'Marcelo', 'Hernán', 'Claudio'
];

const apellidos = [
  'García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'
];

const tiposVoz = ['SOPRANO', 'MESOSOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO'];

const distribucionCiudades = {
  'Santiago': 90,
  'Concepción': 45,
  'Antofagasta': 30,
  'Viña del Mar': 20,
  'Valparaíso': 15,
  'Valdivia': 15
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${cleanFirst}.${cleanLast}@cgplayer.com`;
}

function generateUsername(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${cleanFirst}.${cleanLast}`;
}

// Endpoint para resetear la base de datos (solo ADMIN)
router.post('/reset', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // Eliminar todas las tablas en orden correcto (respetando foreign keys)
    await prisma.$executeRaw`TRUNCATE TABLE event_songs CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE soloists CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE playlist_items CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE playlists CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE lyrics CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE song_assignments CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE songs CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE events CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE user_voice_profiles CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE user_roles CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE locations CASCADE`;

    res.json({
      success: true,
      message: 'Base de datos reseteada exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error durante el reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear la base de datos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para sembrar datos (requiere autenticación)
router.post('/seed', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🚀 Iniciando proceso de seed...');

    // 0. Limpiar base de datos existente
    console.log('🧹 Limpiando base de datos...');
    await prisma.$transaction([
      (prisma as any).eventAttendance.deleteMany(),
      (prisma as any).eventPlaylist.deleteMany(),
      (prisma as any).eventJoinRequest.deleteMany(),
      (prisma as any).eventAttendee.deleteMany(),
      prisma.userVoiceProfile.deleteMany(),
      prisma.userRole_DB.deleteMany(),
      prisma.lyricsFile.deleteMany(),
      prisma.lyric.deleteMany(),
      prisma.soloist.deleteMany(),
      prisma.songAssignment.deleteMany(),
      prisma.playlist.deleteMany(),
      prisma.song.deleteMany(),
      prisma.event.deleteMany(),
      prisma.user.deleteMany(),
      prisma.location.deleteMany()
    ]);

    // 1. Crear ubicaciones
    console.log('📍 Creando ubicaciones...');
    const locations: any[] = [];

    const locationData = [
      { name: 'Catedral Santiago', type: 'SANTIAGO', address: 'Plaza de Armas s/n', city: 'Santiago', region: 'Metropolitana', color: '#1e3a8a' },
      { name: 'Viña del Mar', type: 'VINA_DEL_MAR', address: 'Plaza Vergara', city: 'Viña del Mar', region: 'Valparaíso', color: '#059669' },
      { name: 'Valparaíso', type: 'VINA_DEL_MAR', address: 'Cerro Alegre', city: 'Valparaíso', region: 'Valparaíso', color: '#059669' },
      { name: 'Concepción', type: 'CONCEPCION', address: 'Plaza de Armas', city: 'Concepción', region: 'Biobío', color: '#7c3aed' },
      { name: 'Antofagasta', type: 'ANTOFAGASTA', address: 'Plaza Colón', city: 'Antofagasta', region: 'Antofagasta', color: '#dc2626' },
      { name: 'Valdivia', type: 'VALDIVIA', address: 'Plaza de la República', city: 'Valdivia', region: 'Los Ríos', color: '#ea580c' },
      { name: 'Todos los Coristas', type: 'TODOS_LOS_CORISTAS', address: 'Nacional', city: 'Nacional', region: 'Nacional', color: '#6b7280' }
    ];

    for (const loc of locationData) {
      const location = await prisma.location.create({
        data: {
          name: loc.name,
          type: loc.type as any,
          address: loc.address,
          city: loc.city,
          region: loc.region,
          color: loc.color
        }
      });
      locations.push(location);
    }

    // 2. Crear usuarios de prueba específicos
    console.log('👥 Creando usuarios de prueba...');

    // 2 Administradores
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    
    const admin1 = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        firstName: 'Administrador',
        lastName: 'Principal',
        password: hashedAdminPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const admin2 = await prisma.user.create({
      data: {
        email: 'admin2@cgplayer.com',
        username: 'admin2',
        firstName: 'María Elena',
        lastName: 'González Pérez',
        password: hashedAdminPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Valparaíso')?.id
      }
    });

    // Asignar roles ADMIN
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES 
        (gen_random_uuid(), ${admin1.id}, 'ADMIN'::"UserRole", NOW()),
        (gen_random_uuid(), ${admin2.id}, 'ADMIN'::"UserRole", NOW())
    `;

    // 3 Directores
    const hashedDirectorPassword = await bcrypt.hash('director123', 10);

    const director1 = await prisma.user.create({
      data: {
        email: 'director.santiago@cgplayer.com',
        username: 'director.santiago',
        firstName: 'Carlos Alberto',
        lastName: 'Mendoza Silva',
        password: hashedDirectorPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const director2 = await prisma.user.create({
      data: {
        email: 'director.valparaiso@cgplayer.com',
        username: 'director.valparaiso',
        firstName: 'Ana Patricia',
        lastName: 'Rodríguez López',
        password: hashedDirectorPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Valparaíso')?.id
      }
    });

    const director3 = await prisma.user.create({
      data: {
        email: 'director.concepcion@cgplayer.com',
        username: 'director.concepcion',
        firstName: 'Jorge Luis',
        lastName: 'Hernández Castro',
        password: hashedDirectorPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Concepción')?.id
      }
    });

    // Asignar roles DIRECTOR
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES 
        (gen_random_uuid(), ${director1.id}, 'DIRECTOR'::"UserRole", NOW()),
        (gen_random_uuid(), ${director2.id}, 'DIRECTOR'::"UserRole", NOW()),
        (gen_random_uuid(), ${director3.id}, 'DIRECTOR'::"UserRole", NOW())
    `;

    // 4 Cantantes de prueba específicos
    const hashedCantantePassword = await bcrypt.hash('cantante123', 10);

    const cantantePrueba1 = await prisma.user.create({
      data: {
        email: 'cantante1@cgplayer.com',
        username: 'cantante1',
        firstName: 'Sofía',
        lastName: 'Morales Vega',
        password: hashedCantantePassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const cantantePrueba2 = await prisma.user.create({
      data: {
        email: 'cantante2@cgplayer.com',
        username: 'cantante2',
        firstName: 'Diego',
        lastName: 'Fernández Torres',
        password: hashedCantantePassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Valparaíso')?.id
      }
    });

    const cantantePrueba3 = await prisma.user.create({
      data: {
        email: 'cantante3@cgplayer.com',
        username: 'cantante3',
        firstName: 'Valentina',
        lastName: 'Sánchez Rivera',
        password: hashedCantantePassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Concepción')?.id
      }
    });

    const cantantePrueba4 = await prisma.user.create({
      data: {
        email: 'cantante4@cgplayer.com',
        username: 'cantante4',
        firstName: 'Matías',
        lastName: 'Contreras Díaz',
        password: hashedCantantePassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Antofagasta')?.id
      }
    });

    // Asignar roles CANTANTE
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES 
        (gen_random_uuid(), ${cantantePrueba1.id}, 'CANTANTE'::"UserRole", NOW()),
        (gen_random_uuid(), ${cantantePrueba2.id}, 'CANTANTE'::"UserRole", NOW()),
        (gen_random_uuid(), ${cantantePrueba3.id}, 'CANTANTE'::"UserRole", NOW()),
        (gen_random_uuid(), ${cantantePrueba4.id}, 'CANTANTE'::"UserRole", NOW())
    `;

    // Asignar tipos de voz a cantantes de prueba (algunos con 1, otros con 2)
    await prisma.$executeRaw`
      INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
      VALUES 
        (gen_random_uuid(), ${cantantePrueba1.id}, 'SOPRANO'::"VoiceType", NOW()),
        (gen_random_uuid(), ${cantantePrueba1.id}, 'ALTO'::"VoiceType", NOW()),
        (gen_random_uuid(), ${cantantePrueba2.id}, 'TENOR'::"VoiceType", NOW()),
        (gen_random_uuid(), ${cantantePrueba3.id}, 'SOPRANO'::"VoiceType", NOW()),
        (gen_random_uuid(), ${cantantePrueba4.id}, 'BARITONO'::"VoiceType", NOW()),
        (gen_random_uuid(), ${cantantePrueba4.id}, 'BAJO'::"VoiceType", NOW())
    `;

    // 3. Crear cantantes masivos distribuidos por ciudades
    let cantantesCreados = 0;
    console.log('🎤 Iniciando creación de cantantes masivos...');

    for (const [ciudad, cantidad] of Object.entries(distribucionCiudades)) {
      console.log(`📍 Creando ${cantidad} cantantes para ${ciudad}...`);
      
      const ubicacionesCiudad = locations.filter(loc => 
        loc.city === ciudad || (ciudad === 'Valparaíso' && loc.city === 'Valparaíso')
      );

      for (let i = 0; i < cantidad; i++) {
        const firstName = getRandomElement(nombres);
        const lastName1 = getRandomElement(apellidos);
        const lastName2 = getRandomElement(apellidos);
        const fullLastName = `${lastName1} ${lastName2}`;
        
        let email = generateEmail(firstName, lastName1);
        let username = generateUsername(firstName, lastName1);
        
        // Asegurar emails únicos
        let counter = 1;
        while (await prisma.user.findFirst({ where: { email } })) {
          email = `${generateEmail(firstName, lastName1)}${counter}`;
          username = `${generateUsername(firstName, lastName1)}${counter}`;
          counter++;
        }

        const voiceType = getRandomElement(tiposVoz);
        const ubicacion = getRandomElement(ubicacionesCiudad);
        
        // 15% de probabilidad de que el usuario esté inactivo
        const isActive = Math.random() > 0.15;
        
        // 30% probabilidad de tener teléfono
        const phone = Math.random() < 0.3 ? `+569${Math.floor(Math.random() * 90000000) + 10000000}` : null;
        
        const cantantePassword = await bcrypt.hash('cantante123', 10);
        
        const cantante = await prisma.user.create({
          data: {
            email,
            username,
            firstName,
            lastName: fullLastName,
            password: cantantePassword,
            isActive: isActive,
            locationId: ubicacion.id,
            phone
          }
        });

        // Asignar rol CANTANTE
        await prisma.$executeRaw`
          INSERT INTO user_roles (id, "userId", role, "createdAt")
          VALUES (gen_random_uuid(), ${cantante.id}, 'CANTANTE'::"UserRole", NOW())
        `;

        // Asignar perfil de voz
        await prisma.$executeRaw`
          INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
          VALUES (gen_random_uuid(), ${cantante.id}, ${voiceType}::"VoiceType", NOW())
        `;

        cantantesCreados++;
        
        // Log cada 50 cantantes creados
        if (cantantesCreados % 50 === 0) {
          console.log(`✅ ${cantantesCreados} cantantes creados...`);
        }

        // 20% probabilidad de tener segundo tipo de voz
        if (Math.random() < 0.2) {
          const availableVoices = tiposVoz.filter(v => v !== voiceType);
          const secondVoice = getRandomElement(availableVoices);
          
          await prisma.$executeRaw`
            INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
            VALUES (gen_random_uuid(), ${cantante.id}, ${secondVoice}::"VoiceType", NOW())
          `;
        }
      }
    }

    // Estadísticas finales
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.location.count(),
      prisma.userRole_DB.count(),
      prisma.userVoiceProfile.count()
    ]);

    console.log('🎉 Seed completado exitosamente!');

    res.json({
      success: true,
      message: 'Datos sembrados exitosamente',
      stats: {
        totalUsers: stats[0],
        activeUsers: stats[1],
        inactiveUsers: stats[2],
        locations: stats[3],
        totalRoleAssignments: stats[4],
        totalVoiceProfiles: stats[5],
        distribution: distribucionCiudades,
        testUsers: {
          admins: ['admin@cgplayer.com', 'admin2@cgplayer.com'],
          directors: ['director.santiago@cgplayer.com', 'director.valparaiso@cgplayer.com', 'director.concepcion@cgplayer.com'],
          singers: ['cantante1@cgplayer.com', 'cantante2@cgplayer.com', 'cantante3@cgplayer.com', 'cantante4@cgplayer.com']
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error durante el seed:', error);
    res.status(500).json({
      success: false,
      message: 'Error al sembrar datos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
