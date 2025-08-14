const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos para generar usuarios realistas
const nombres = [
  'María', 'Carmen', 'Josefa', 'Isabel', 'Ana', 'Francisca', 'Dolores', 'Antonia', 'Pilar', 'Teresa',
  'Rosa', 'Concepción', 'Mercedes', 'Esperanza', 'Amparo', 'Soledad', 'Remedios', 'Milagros', 'Encarnación', 'Asunción',
  'Cristina', 'Elena', 'Patricia', 'Laura', 'Mónica', 'Sandra', 'Beatriz', 'Rocío', 'Silvia', 'Nuria',
  'José', 'Antonio', 'Manuel', 'Francisco', 'Juan', 'David', 'José Antonio', 'José Luis', 'Jesús', 'Javier',
  'Carlos', 'Miguel', 'Rafael', 'Pedro', 'Daniel', 'Fernando', 'Alejandro', 'Sergio', 'Pablo', 'Jorge',
  'Alberto', 'Luis', 'Álvaro', 'Roberto', 'Adrián', 'Óscar', 'Raúl', 'Rubén', 'Iván', 'Gonzalo',
  'Lucía', 'Paula', 'Claudia', 'Andrea', 'Sofía', 'Valentina', 'Martina', 'Catalina', 'Fernanda', 'Javiera',
  'Camila', 'Florencia', 'Constanza', 'Maite', 'Ignacia', 'Emilia', 'Agustina', 'Isidora', 'Amparo', 'Esperanza'
];

const apellidos = [
  'García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'
];

const tiposVoz = ['SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO', 'MESOSOPRANO', 'CORO', 'ORIGINAL'];

// Distribución de cantantes por ciudad (total: 150)
const distribucionCiudades = {
  'Santiago': 60,      // 40%
  'Concepción': 30,    // 20%
  'Antofagasta': 20,   // 13%
  'Viña del Mar': 15,  // 10%
  'Valparaíso': 13,    // 9%
  'Valdivia': 12       // 8%
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName, lastName) {
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${cleanFirst}.${cleanLast}@cgplayer.com`;
}

function generateUsername(firstName, lastName) {
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${cleanFirst}.${cleanLast}`;
}

async function main() {
  console.log('🚀 Iniciando creación de datos base del sistema...');

  try {
    // 1. Crear ubicaciones
    console.log('📍 Creando ubicaciones...');
    const locations = [];

    const locationData = [
      { name: 'Iglesia Catedral Santiago', type: 'SANTIAGO', address: 'Plaza de Armas s/n', city: 'Santiago', region: 'Metropolitana' },
      { name: 'Parroquia San Francisco', type: 'SANTIAGO', address: 'Av. Libertador Bernardo O\'Higgins 834', city: 'Santiago', region: 'Metropolitana' },
      { name: 'Iglesia La Merced', type: 'SANTIAGO', address: 'Mac Iver 341', city: 'Santiago', region: 'Metropolitana' },
      { name: 'Catedral de Viña del Mar', type: 'VINA_DEL_MAR', address: 'Plaza Vergara', city: 'Viña del Mar', region: 'Valparaíso' },
      { name: 'Iglesia San José Valparaíso', type: 'VINA_DEL_MAR', address: 'Cerro Alegre', city: 'Valparaíso', region: 'Valparaíso' },
      { name: 'Catedral de Concepción', type: 'CONCEPCION', address: 'Plaza de Armas', city: 'Concepción', region: 'Biobío' },
      { name: 'Iglesia San Marcos Antofagasta', type: 'ANTOFAGASTA', address: 'Plaza Colón', city: 'Antofagasta', region: 'Antofagasta' },
      { name: 'Catedral de Valdivia', type: 'VALDIVIA', address: 'Plaza de la República', city: 'Valdivia', region: 'Los Ríos' }
    ];

    for (const loc of locationData) {
      const location = await prisma.location.create({
        data: {
          name: loc.name,
          type: loc.type,
          address: loc.address,
          city: loc.city,
          region: loc.region
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
      VALUES (gen_random_uuid(), ${admin.id}, 'ADMIN', NOW())
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
        (gen_random_uuid(), ${adminSinger.id}, 'ADMIN', NOW()),
        (gen_random_uuid(), ${adminSinger.id}, 'CANTANTE', NOW())
    `;

    // Asignar perfil de voz BARITONO al admin-cantante
    await prisma.$executeRaw`
      INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
      VALUES (gen_random_uuid(), ${adminSinger.id}, 'BARITONO'::"VoiceType", NOW())
    `;

    // 4. Crear 150 cantantes distribuidos por ciudades
    console.log('🎵 Creando 150 cantantes...');
    let cantantesCreados = 0;

    for (const [ciudad, cantidad] of Object.entries(distribucionCiudades)) {
      console.log(`   📍 Creando ${cantidad} cantantes en ${ciudad}...`);
      
      // Encontrar ubicaciones de esta ciudad
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
        
        const cantantePassword = await bcrypt.hash('cantante123', 10);
        
        const cantante = await prisma.user.create({
          data: {
            email,
            username,
            firstName,
            lastName: fullLastName,
            password: cantantePassword,
            isActive: true,
            locationId: ubicacion.id
          }
        });

        // Asignar rol CANTANTE
        await prisma.$executeRaw`
          INSERT INTO user_roles (id, "userId", role, "createdAt")
          VALUES (gen_random_uuid(), ${cantante.id}, 'CANTANTE', NOW())
        `;

        // Asignar perfil de voz
        await prisma.$executeRaw`
          INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
          VALUES (gen_random_uuid(), ${cantante.id}, ${voiceType}::"VoiceType", NOW())
        `;

        cantantesCreados++;
        
        // Progress indicator
        if (cantantesCreados % 10 === 0) {
          console.log(`     ✅ ${cantantesCreados}/150 cantantes creados...`);
        }
      }
    }

    // 5. Crear algunos eventos base
    console.log('📅 Creando eventos base...');
    const eventos = [
      {
        title: 'Concierto de Navidad 2025',
        description: 'Celebración navideña con coros de todas las regiones',
        date: new Date('2025-12-24T19:00:00Z'),
        locationId: locations.find(l => l.city === 'Santiago').id,
        category: 'Especial'
      },
      {
        title: 'Festival de Pascua',
        description: 'Celebración de la Pascua con música sacra',
        date: new Date('2026-04-12T18:00:00Z'),
        locationId: locations.find(l => l.city === 'Concepción').id,
        category: 'Religioso'
      },
      {
        title: 'Encuentro de Coros del Norte',
        description: 'Encuentro regional de coros del norte de Chile',
        date: new Date('2025-09-15T16:00:00Z'),
        locationId: locations.find(l => l.city === 'Antofagasta').id,
        category: 'Regional'
      }
    ];

    for (const evento of eventos) {
      await prisma.event.create({ data: evento });
    }

    // Estadísticas finales
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_usuarios,
        (SELECT COUNT(*) FROM user_roles WHERE role = 'ADMIN') as admins,
        (SELECT COUNT(*) FROM user_roles WHERE role = 'CANTANTE') as cantantes,
        (SELECT COUNT(*) FROM locations) as ubicaciones,
        (SELECT COUNT(*) FROM events) as eventos
    `;

    const voiceStats = await prisma.$queryRaw`
      SELECT uvp."voiceType", COUNT(*) as cantidad
      FROM user_voice_profiles uvp
      GROUP BY uvp."voiceType"
      ORDER BY cantidad DESC
    `;

    const cityStats = await prisma.$queryRaw`
      SELECT l.city, COUNT(u.id) as cantantes
      FROM locations l
      LEFT JOIN users u ON l.id = u."locationId"
      WHERE u.id IS NOT NULL
      GROUP BY l.city
      ORDER BY cantantes DESC
    `;

    console.log('\n🎉 ¡Base de datos inicializada exitosamente!');
    console.log('=====================================');
    console.log(`👥 Total usuarios: ${stats[0].total_usuarios}`);
    console.log(`🔑 Administradores: ${stats[0].admins}`);
    console.log(`🎤 Cantantes: ${stats[0].cantantes}`);
    console.log(`📍 Ubicaciones: ${stats[0].ubicaciones}`);
    console.log(`📅 Eventos: ${stats[0].eventos}`);
    
    console.log('\n🎭 Distribución por tipo de voz:');
    voiceStats.forEach((stat) => {
      console.log(`   ${stat.voiceType}: ${stat.cantidad} cantantes`);
    });

    console.log('\n🏙️ Distribución por ciudad:');
    cityStats.forEach((stat) => {
      console.log(`   ${stat.city}: ${stat.cantantes} cantantes`);
    });

    console.log('\n🔐 Credenciales de acceso:');
    console.log('📧 Admin Principal: admin@cgplayer.com | Contraseña: admin123');
    console.log('🎵 Admin-Cantante: admin.cantante@cgplayer.com | Contraseña: admincantante123');
    console.log('🎤 Cantantes: [nombre].[apellido]@cgplayer.com | Contraseña: cantante123');
    
    console.log('\n✨ El sistema está listo para recibir canciones de los usuarios');

  } catch (error) {
    console.error('❌ Error al crear datos:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error al crear datos de ejemplo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
