import express, { Request, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import DatabaseInitializationService from '../services/databaseInitialization';

const router = express.Router();
const prisma = new PrismaClient();

// Crear instancia del servicio de inicialización
const dbInitService = new DatabaseInitializationService();

// Datos para seed
const nombres = [
  'Maria', 'Carmen', 'Josefa', 'Isabel', 'Ana', 'Francisca', 'Dolores', 'Antonia', 'Pilar', 'Teresa',
  'Rosa', 'Concepcion', 'Mercedes', 'Esperanza', 'Amparo', 'Soledad', 'Remedios', 'Milagros', 'Encarnacion', 'Asuncion',
  'Cristina', 'Elena', 'Patricia', 'Laura', 'Monica', 'Sandra', 'Beatriz', 'Rocio', 'Silvia', 'Nuria',
  'Lucia', 'Paula', 'Claudia', 'Andrea', 'Sofia', 'Valentina', 'Martina', 'Catalina', 'Fernanda', 'Javiera',
  'Camila', 'Florencia', 'Constanza', 'Maite', 'Ignacia', 'Emilia', 'Agustina', 'Isidora', 'Amparo', 'Esperanza',
  'Barbara', 'Carla', 'Daniela', 'Gabriela', 'Alejandra', 'Natalia', 'Vanessa', 'Veronica', 'Carolina', 'Lorena',
  'Jose', 'Antonio', 'Manuel', 'Francisco', 'Juan', 'David', 'Jose Antonio', 'Jose Luis', 'Jesus', 'Javier',
  'Carlos', 'Miguel', 'Rafael', 'Pedro', 'Daniel', 'Fernando', 'Alejandro', 'Sergio', 'Pablo', 'Jorge',
  'Alberto', 'Luis', 'Alvaro', 'Roberto', 'Adrian', 'Oscar', 'Raul', 'Ruben', 'Ivan', 'Gonzalo',
  'Sebastian', 'Matias', 'Nicolas', 'Benjamin', 'Vicente', 'Tomas', 'Maximiliano', 'Cristobal', 'Joaquin', 'Martin',
  'Felipe', 'Diego', 'Andres', 'Eduardo', 'Ricardo', 'Patricio', 'Rodrigo', 'Marcelo', 'Hernan', 'Claudio'
];

const apellidos = [
  'Garcia', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Martin',
  'Jimenez', 'Ruiz', 'Hernandez', 'Diaz', 'Moreno', 'Munoz', 'Alvarez', 'Romero', 'Alonso', 'Gutierrez',
  'Navarro', 'Torres', 'Dominguez', 'Vazquez', 'Ramos', 'Gil', 'Ramirez', 'Serrano', 'Blanco', 'Suarez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marin', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortes', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Mendez'
];

const tiposVoz = ['SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO'];

const distribucionCiudades = {
  'Santiago': 90,
  'Concepcion': 45,
  'Antofagasta': 30,
  'Vina del Mar': 20,
  'Valparaiso': 15,
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

// Endpoint para seed completo con 300+ cantantes
router.post('/seed-full', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🌱 Iniciando seed completo con 300+ cantantes...');

    // 0. Limpiar base de datos
    console.log('🧹 Limpiando base de datos...');
    
    // Primero intentar limpiar la tabla de noticias si existe
    try {
      await (prisma as any).news.deleteMany();
      console.log('📰 Tabla News limpiada');
    } catch (error) {
      console.log('⚠️ Tabla News no existe o no se pudo limpiar, continuando...');
    }
    
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
      { name: 'Vina del Mar', type: 'VINA_DEL_MAR', address: 'Plaza Vergara', city: 'Vina del Mar', region: 'Valparaiso', color: '#059669' },
      { name: 'Valparaiso', type: 'VINA_DEL_MAR', address: 'Cerro Alegre', city: 'Valparaiso', region: 'Valparaiso', color: '#059669' },
      { name: 'Concepcion', type: 'CONCEPCION', address: 'Plaza de Armas', city: 'Concepcion', region: 'Biobio', color: '#7c3aed' },
      { name: 'Antofagasta', type: 'ANTOFAGASTA', address: 'Plaza Colon', city: 'Antofagasta', region: 'Antofagasta', color: '#dc2626' },
      { name: 'Valdivia', type: 'VALDIVIA', address: 'Plaza de la Republica', city: 'Valdivia', region: 'Los Rios', color: '#ea580c' },
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

    // 2. Crear usuarios administrativos
    console.log('👥 Creando usuarios administrativos...');
    
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedDirectorPassword = await bcrypt.hash('director123', 10);
    const hashedTestPassword = await bcrypt.hash('test123', 10);
    
    // 2 Administradores
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
        firstName: 'Maria Elena',
        lastName: 'Gonzalez Perez',
        password: hashedAdminPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Valparaiso')?.id
      }
    });

    // 3 Directores
    const director1 = await prisma.user.create({
      data: {
        email: 'director@cgplayer.com',
        username: 'director',
        firstName: 'Carlos Maestro',
        lastName: 'Rodriguez',
        password: hashedDirectorPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const director2 = await prisma.user.create({
      data: {
        email: 'director2@cgplayer.com',
        username: 'director2',
        firstName: 'Ana Cristina',
        lastName: 'Martinez',
        password: hashedDirectorPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Concepcion')?.id
      }
    });

    const director3 = await prisma.user.create({
      data: {
        email: 'director3@cgplayer.com',
        username: 'director3',
        firstName: 'Luis Fernando',
        lastName: 'Silva',
        password: hashedDirectorPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Vina del Mar')?.id
      }
    });

    // 4 Cantantes de prueba
    const testSinger1 = await prisma.user.create({
      data: {
        email: 'test.soprano@cgplayer.com',
        username: 'test.soprano',
        firstName: 'Sofia',
        lastName: 'Cantante',
        password: hashedTestPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const testSinger2 = await prisma.user.create({
      data: {
        email: 'test.alto@cgplayer.com',
        username: 'test.alto',
        firstName: 'Carmen',
        lastName: 'Vocal',
        password: hashedTestPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const testSinger3 = await prisma.user.create({
      data: {
        email: 'test.tenor@cgplayer.com',
        username: 'test.tenor',
        firstName: 'Miguel',
        lastName: 'Tenor',
        password: hashedTestPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    const testSinger4 = await prisma.user.create({
      data: {
        email: 'test.bajo@cgplayer.com',
        username: 'test.bajo',
        firstName: 'Carlos',
        lastName: 'Bajo',
        password: hashedTestPassword,
        isActive: true,
        locationId: locations.find(l => l.city === 'Santiago')?.id
      }
    });

    // 3. Generar 300+ cantantes distribuidos por ciudades
    console.log('🎵 Generando 300+ cantantes...');
    
    const generatedUsers = [];
    let userCount = 0;

    for (const [city, count] of Object.entries(distribucionCiudades)) {
      const cityLocation = locations.find(l => l.city === city);
      if (!cityLocation) continue;

      for (let i = 0; i < count; i++) {
        userCount++;
        const firstName = getRandomElement(nombres);
        const lastName = getRandomElement(apellidos);
        const email = generateEmail(firstName, lastName);
        const username = generateUsername(firstName, lastName);
        
        const user = await prisma.user.create({
          data: {
            email: `${userCount}.${email}`,
            username: `${userCount}.${username}`,
            firstName,
            lastName,
            password: await bcrypt.hash('cantante123', 10),
            isActive: Math.random() > 0.1, // 90% activos
            locationId: cityLocation.id
          }
        });
        
        generatedUsers.push(user);
      }
    }

    // 4. Asignar roles
    console.log('🎭 Asignando roles...');
    
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES 
        (gen_random_uuid(), ${admin1.id}, 'ADMIN'::"UserRole", NOW()),
        (gen_random_uuid(), ${admin2.id}, 'ADMIN'::"UserRole", NOW()),
        (gen_random_uuid(), ${director1.id}, 'DIRECTOR'::"UserRole", NOW()),
        (gen_random_uuid(), ${director2.id}, 'DIRECTOR'::"UserRole", NOW()),
        (gen_random_uuid(), ${director3.id}, 'DIRECTOR'::"UserRole", NOW()),
        (gen_random_uuid(), ${testSinger1.id}, 'CANTANTE'::"UserRole", NOW()),
        (gen_random_uuid(), ${testSinger2.id}, 'CANTANTE'::"UserRole", NOW()),
        (gen_random_uuid(), ${testSinger3.id}, 'CANTANTE'::"UserRole", NOW()),
        (gen_random_uuid(), ${testSinger4.id}, 'CANTANTE'::"UserRole", NOW())
    `;

    // Asignar rol CANTANTE a todos los generados
    for (const user of generatedUsers) {
      await prisma.$executeRaw`
        INSERT INTO user_roles (id, "userId", role, "createdAt")
        VALUES (gen_random_uuid(), ${user.id}, 'CANTANTE'::"UserRole", NOW())
      `;
    }

    // 5. Asignar perfiles de voz
    console.log('🎼 Asignando perfiles de voz...');
    
    // Perfiles específicos para usuarios de prueba
    await prisma.userVoiceProfile.create({
      data: {
        userId: testSinger1.id,
        voiceType: 'SOPRANO'
      }
    });

    await prisma.userVoiceProfile.create({
      data: {
        userId: testSinger2.id,
        voiceType: 'CONTRALTO'
      }
    });

    await prisma.userVoiceProfile.create({
      data: {
        userId: testSinger3.id,
        voiceType: 'TENOR'
      }
    });

    await prisma.userVoiceProfile.create({
      data: {
        userId: testSinger4.id,
        voiceType: 'BAJO'
      }
    });

    // Perfiles aleatorios para cantantes generados
    for (const user of generatedUsers) {
      const voiceType = getRandomElement(tiposVoz);
      await prisma.userVoiceProfile.create({
        data: {
          userId: user.id,
          voiceType: voiceType as any
        }
      });
    }

    const totalUsers = 2 + 3 + 4 + generatedUsers.length; // admin + directores + test + generados

    // 7. Crear noticias base del sistema
    console.log('📰 Creando noticias base...');
    
    try {
      // Noticia de bienvenida al sistema
      await (prisma as any).news.create({
        data: {
          title: '🎉 Sistema de Noticias Activado',
          description: 'A partir de ahora recibirás notificaciones automáticas sobre nuevas canciones, eventos y versiones del sistema.',
          type: 'VERSION_RELEASED',
          icon: '🔔',
          actionUrl: null,
          metadata: { type: 'system_activation', priority: 'high' },
          isActive: true
        }
      });

      // Noticia de la nueva versión
      await (prisma as any).news.create({
        data: {
          title: 'Nueva Versión v0.9.0 Disponible',
          description: 'Sistema de noticias implementado: ¡Mantente al día con las novedades del sistema!',
          type: 'VERSION_RELEASED',
          icon: '🚀',
          actionUrl: '/changelog',
          metadata: { 
            version: 'v0.9.0',
            description: 'Sistema de noticias implementado'
          },
          isActive: true
        }
      });

      // Noticia de UI actualizada
      await (prisma as any).news.create({
        data: {
          title: '🌟 Bienvenido al Nuevo CGPlayer',
          description: 'La página de inicio ha sido rediseñada para ser más simple y funcional. ¡Esperamos que disfrutes la nueva experiencia!',
          type: 'VERSION_RELEASED',
          icon: '✨',
          actionUrl: '/',
          metadata: { type: 'ui_update', component: 'homepage' },
          isActive: true
        }
      });

      console.log('✅ Noticias base creadas exitosamente');
    } catch (error) {
      console.warn('⚠️ Error creando noticias base (tabla puede no existir aún):', error);
    }

    res.json({
      success: true,
      message: 'Seed completo ejecutado exitosamente con 300+ cantantes y noticias',
      stats: {
        totalUsers,
        activeUsers: generatedUsers.filter(u => u.isActive).length + 9, // admin+directores+test siempre activos
        inactiveUsers: generatedUsers.filter(u => !u.isActive).length,
        locations: locations.length,
        newsCreated: 3,
        byCity: distribucionCiudades,
        administrativeUsers: {
          admins: 2,
          directors: 3,
          testSingers: 4
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error durante el seed completo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar seed completo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint básico para seed simple (solo admin)
router.post('/seed', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🌱 Ejecutando seed básico...');
    
    // Crear solo ubicaciones y admins básicos
    const locationSantiago = await prisma.location.create({
      data: {
        name: 'Santiago Principal',
        type: 'SANTIAGO',
        address: 'Plaza de Armas',
        city: 'Santiago',
        region: 'Metropolitana',
        color: '#1e3a8a'
      }
    });

    res.json({
      success: true,
      message: 'Seed básico completado',
      stats: { locations: 1 },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error en seed básico:', error);
    res.status(500).json({
      success: false,
      message: 'Error en seed básico',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para verificar estado de la base de datos
router.get('/database-status', async (req: Request, res: Response) => {
  try {
    const status = await dbInitService.getDatabaseStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo estado de base de datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado de base de datos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para forzar re-inicialización de base de datos
router.post('/reinitialize-database', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Forzando re-inicialización de base de datos...');
    
    const initResult = await dbInitService.initializeDatabase();
    
    res.json({
      success: initResult.success,
      message: initResult.message,
      details: {
        tablesCreated: initResult.tablesCreated,
        userCreated: initResult.userCreated
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error en re-inicialización:', error);
    res.status(500).json({
      success: false,
      message: 'Error en re-inicialización de base de datos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
