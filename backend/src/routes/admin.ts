import express, { Response } from 'express';
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

/**
 * @swagger
 * /admin/reset-database:
 *   post:
 *     summary: Resetear la base de datos completamente
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Base de datos reseteada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Base de datos reseteada exitosamente
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permisos insuficientes (solo ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Endpoint para resetear la base de datos (solo ADMIN)
router.post('/reset', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Iniciando reset completo de la base de datos...');

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

    console.log('✅ Todas las tablas han sido vaciadas');

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

/**
 * @swagger
 * /admin/seed:
 *   post:
 *     summary: Sembrar datos de ejemplo en la base de datos
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos sembrados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Datos sembrados exitosamente
 *                 stats:
 *                   type: object
 *                   properties:
 *                     locations:
 *                       type: number
 *                       description: Número de ubicaciones creadas
 *                     users:
 *                       type: number
 *                       description: Número de usuarios creados
 *                     events:
 *                       type: number
 *                       description: Número de eventos creados
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permisos insuficientes (solo ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Endpoint para sembrar datos
router.post('/seed', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🌱 Iniciando seed de datos...');

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

    // 2. Crear usuario administrador principal
    console.log('👤 Creando usuario administrador...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        firstName: 'Administrador',
        lastName: 'Sistema',
        password: hashedAdminPassword,
        isActive: true
      }
    });

    // Asignar rol ADMIN
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${admin.id}, 'ADMIN'::"UserRole", NOW())
    `;

    // 3. Crear usuario admin-cantante
    console.log('🎤 Creando usuario admin-cantante...');
    const hashedAdminSingerPassword = await bcrypt.hash('admincantante123', 10);
    
    const adminSinger = await prisma.user.create({
      data: {
        email: 'admin.cantante@cgplayer.com',
        username: 'admin.cantante',
        firstName: 'Director',
        lastName: 'Musical',
        password: hashedAdminSingerPassword,
        isActive: true
      }
    });

    // Asignar roles ADMIN y CANTANTE
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES 
        (gen_random_uuid(), ${adminSinger.id}, 'ADMIN'::"UserRole", NOW()),
        (gen_random_uuid(), ${adminSinger.id}, 'CANTANTE'::"UserRole", NOW())
    `;

    // Asignar perfil de voz BARITONO al admin-cantante
    await prisma.$executeRaw`
      INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
      VALUES (gen_random_uuid(), ${adminSinger.id}, 'BARITONO'::"VoiceType", NOW())
    `;

    // 4. Crear cantantes distribuidos por ciudades
    console.log('🎵 Creando 215 cantantes...');
    let cantantesCreados = 0;

    for (const [ciudad, cantidad] of Object.entries(distribucionCiudades)) {
      console.log(`   📍 Creando ${cantidad} cantantes en ${ciudad}...`);
      
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
        
        const cantantePassword = await bcrypt.hash('cantante123', 10);
        
        const cantante = await prisma.user.create({
          data: {
            email,
            username,
            firstName,
            lastName: fullLastName,
            password: cantantePassword,
            isActive: isActive,
            locationId: ubicacion.id
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
      }
    }

    // 5. Crear algunos eventos base
    console.log('📅 Creando eventos base...');
    const eventos = [
      {
        title: 'Concierto de Navidad 2025',
        description: 'Celebración navideña con coros de todas las regiones',
        date: new Date('2025-12-24T19:00:00Z'),
        locationId: locations.find(l => l.city === 'Santiago')!.id,
        category: 'Especial'
      },
      {
        title: 'Festival de Pascua',
        description: 'Celebración de la Pascua con música sacra',
        date: new Date('2026-04-12T18:00:00Z'),
        locationId: locations.find(l => l.city === 'Concepción')!.id,
        category: 'Religioso'
      },
      {
        title: 'Encuentro de Coros del Norte',
        description: 'Encuentro regional de coros del norte de Chile',
        date: new Date('2025-09-15T16:00:00Z'),
        locationId: locations.find(l => l.city === 'Antofagasta')!.id,
        category: 'Regional'
      }
    ];

    for (const evento of eventos) {
      await prisma.event.create({ data: evento });
    }

    // Estadísticas finales
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.location.count(),
      prisma.event.count()
    ]);

    console.log('✅ Seed completado exitosamente');

    res.json({
      success: true,
      message: 'Datos sembrados exitosamente',
      stats: {
        totalUsers: stats[0],
        activeUsers: stats[1],
        inactiveUsers: stats[2],
        locations: stats[3],
        events: stats[4]
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
