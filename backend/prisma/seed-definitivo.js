const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Nombres y apellidos chilenos realistas
const nombresHombres = [
  'José', 'Antonio', 'Manuel', 'Francisco', 'Juan', 'David', 'Carlos', 'Miguel', 'Rafael', 'Pedro',
  'Daniel', 'Fernando', 'Alejandro', 'Sergio', 'Pablo', 'Jorge', 'Alberto', 'Luis', 'Álvaro', 'Roberto',
  'Adrián', 'Óscar', 'Raúl', 'Rubén', 'Iván', 'Gonzalo', 'Mauricio', 'Eduardo', 'Ricardo', 'Andrés',
  'Marcelo', 'Gabriel', 'Rodrigo', 'Cristián', 'Felipe', 'Ignacio', 'Nicolás', 'Patricio', 'Sebastián', 'Matías'
];

const nombresMujeres = [
  'María', 'Carmen', 'Josefa', 'Isabel', 'Ana', 'Francisca', 'Dolores', 'Antonia', 'Pilar', 'Teresa',
  'Rosa', 'Concepción', 'Mercedes', 'Esperanza', 'Amparo', 'Soledad', 'Remedios', 'Cristina', 'Elena', 'Patricia',
  'Laura', 'Mónica', 'Sandra', 'Beatriz', 'Rocío', 'Silvia', 'Nuria', 'Lucía', 'Paula', 'Claudia',
  'Andrea', 'Sofía', 'Valentina', 'Martina', 'Catalina', 'Fernanda', 'Javiera', 'Camila', 'Florencia', 'Constanza'
];

const apellidos = [
  'García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez',
  'Silva', 'Vargas', 'Herrera', 'Aguilar', 'Mendoza', 'Rojas', 'Carrasco', 'Espinoza', 'Contreras', 'Fuentes'
];

// Distribución según especificaciones
const distribucionCantantes = {
  'Santiago': 120,      // 2 directores
  'Viña del Mar': 40,   // 1 director
  'Concepción': 60,     // 1 director
  'Antofagasta': 50,    // 1 director
  'Valdivia': 35        // 1 director
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

// Función para generar tipos de voz según género
function generateVoiceTypes(isMan) {
  if (isMan) {
    // Todos los hombres cantan TENOR, algunos también BARITONO
    const voiceTypes = ['TENOR'];
    if (Math.random() < 0.3) { // 30% probabilidad de también cantar barítono
      voiceTypes.push('BARITONO');
    }
    return voiceTypes;
  } else {
    // Mujeres: soprano o contralto, algunas ambas o mesosoprano
    const random = Math.random();
    if (random < 0.4) {
      return ['SOPRANO'];
    } else if (random < 0.7) {
      return ['CONTRALTO'];
    } else if (random < 0.9) {
      return ['SOPRANO', 'CONTRALTO']; // Puede cantar ambas
    } else {
      return ['MESOSOPRANO']; // Voz intermedia
    }
  }
}

async function main() {
  console.log('🚀 Iniciando creación del seed definitivo...');

  try {
    // 1. Crear ubicaciones (sin "Iglesia" en el nombre)
    console.log('📍 Creando ubicaciones...');
    const locations = [];

    const locationData = [
      { name: 'Santiago Centro', type: 'SANTIAGO', address: 'Plaza de Armas s/n', city: 'Santiago', region: 'Metropolitana' },
      { name: 'Santiago Oriente', type: 'SANTIAGO', address: 'Av. Providencia 1000', city: 'Santiago', region: 'Metropolitana' },
      { name: 'Viña del Mar', type: 'VINA_DEL_MAR', address: 'Plaza Vergara s/n', city: 'Viña del Mar', region: 'Valparaíso' },
      { name: 'Concepción', type: 'CONCEPCION', address: 'Plaza de Armas s/n', city: 'Concepción', region: 'Biobío' },
      { name: 'Antofagasta', type: 'ANTOFAGASTA', address: 'Plaza Colón s/n', city: 'Antofagasta', region: 'Antofagasta' },
      { name: 'Valdivia', type: 'VALDIVIA', address: 'Plaza de la República s/n', city: 'Valdivia', region: 'Los Ríos' }
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

    // 2. Crear 2 administradores
    console.log('👤 Creando administradores...');
    
    const admin1Password = await bcrypt.hash('admin123', 10);
    const admin1 = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        firstName: 'Administrador',
        lastName: 'Principal',
        password: admin1Password,
        isActive: true
      }
    });

    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${admin1.id}, 'ADMIN', NOW())
    `;

    const admin2Password = await bcrypt.hash('admin2123', 10);
    const admin2 = await prisma.user.create({
      data: {
        email: 'admin.sistema@cgplayer.com',
        username: 'admin.sistema',
        firstName: 'Administrador',
        lastName: 'Sistema',
        password: admin2Password,
        isActive: true
      }
    });

    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${admin2.id}, 'ADMIN', NOW())
    `;

    // 3. Crear directores por ubicación
    console.log('🎭 Creando directores...');
    const directores = [];

    // 2 directores para Santiago
    for (let i = 1; i <= 2; i++) {
      const firstName = getRandomElement(nombresHombres);
      const lastName1 = getRandomElement(apellidos);
      const lastName2 = getRandomElement(apellidos);
      const fullLastName = `${lastName1} ${lastName2}`;
      
      const email = `director.santiago${i}@cgplayer.com`;
      const username = `director.santiago${i}`;
      
      const directorPassword = await bcrypt.hash('director123', 10);
      const santiago = locations.find(l => l.city === 'Santiago');
      
      const director = await prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName: fullLastName,
          password: directorPassword,
          isActive: true,
          locationId: santiago.id
        }
      });

      await prisma.$executeRaw`
        INSERT INTO user_roles (id, "userId", role, "createdAt")
        VALUES (gen_random_uuid(), ${director.id}, 'DIRECTOR', NOW())
      `;

      directores.push(director);
    }

    // 1 director para cada otra ubicación
    const otrasUbicaciones = ['Viña del Mar', 'Concepción', 'Antofagasta', 'Valdivia'];
    for (const ciudad of otrasUbicaciones) {
      const firstName = getRandomElement(nombresHombres);
      const lastName1 = getRandomElement(apellidos);
      const lastName2 = getRandomElement(apellidos);
      const fullLastName = `${lastName1} ${lastName2}`;
      
      const ciudadKey = ciudad.toLowerCase().replace(' ', '').replace('ó', 'o');
      const email = `director.${ciudadKey}@cgplayer.com`;
      const username = `director.${ciudadKey}`;
      
      const directorPassword = await bcrypt.hash('director123', 10);
      const location = locations.find(l => l.city === ciudad);
      
      const director = await prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName: fullLastName,
          password: directorPassword,
          isActive: true,
          locationId: location.id
        }
      });

      await prisma.$executeRaw`
        INSERT INTO user_roles (id, "userId", role, "createdAt")
        VALUES (gen_random_uuid(), ${director.id}, 'DIRECTOR', NOW())
      `;

      directores.push(director);
    }

    // 4. Crear cantantes distribuidos por ciudades
    console.log('🎵 Creando cantantes...');
    let cantantesCreados = 0;
    const emailsUsados = new Set();

    for (const [ciudad, cantidad] of Object.entries(distribucionCantantes)) {
      console.log(`   📍 Creando ${cantidad} cantantes en ${ciudad}...`);
      
      // Encontrar ubicaciones de esta ciudad
      const ubicacionesCiudad = locations.filter(loc => loc.city === ciudad);

      for (let i = 0; i < cantidad; i++) {
        // Determinar si el usuario estará activo (70-90% activos)
        const activePercentage = 0.7 + (Math.random() * 0.2); // Entre 70% y 90%
        const isActive = Math.random() < activePercentage;
        
        // Determinar género (50/50)
        const isMan = Math.random() < 0.5;
        const firstName = isMan ? getRandomElement(nombresHombres) : getRandomElement(nombresMujeres);
        const lastName1 = getRandomElement(apellidos);
        const lastName2 = getRandomElement(apellidos);
        const fullLastName = `${lastName1} ${lastName2}`;
        
        let email = generateEmail(firstName, lastName1);
        let username = generateUsername(firstName, lastName1);
        
        // Asegurar emails únicos
        let counter = 1;
        while (emailsUsados.has(email)) {
          email = `${generateEmail(firstName, lastName1)}${counter}`;
          username = `${generateUsername(firstName, lastName1)}${counter}`;
          counter++;
        }
        emailsUsados.add(email);

        const voiceTypes = generateVoiceTypes(isMan);
        const ubicacion = getRandomElement(ubicacionesCiudad);
        
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
          VALUES (gen_random_uuid(), ${cantante.id}, 'CANTANTE', NOW())
        `;

        // Asignar perfiles de voz
        for (const voiceType of voiceTypes) {
          await prisma.$executeRaw`
            INSERT INTO user_voice_profiles (id, "userId", "voiceType", "createdAt")
            VALUES (gen_random_uuid(), ${cantante.id}, ${voiceType}::"VoiceType", NOW())
          `;
        }

        cantantesCreados++;
        
        // Progress indicator
        if (cantantesCreados % 25 === 0) {
          console.log(`     ✅ ${cantantesCreados}/${Object.values(distribucionCantantes).reduce((a, b) => a + b, 0)} cantantes creados...`);
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
      },
      {
        title: 'Encuentro Nacional de Coros',
        description: 'Encuentro nacional con participación de todos los coros',
        date: new Date('2025-11-10T18:00:00Z'),
        locationId: locations.find(l => l.city === 'Santiago').id,
        category: 'Nacional'
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
        (SELECT COUNT(*) FROM user_roles WHERE role = 'DIRECTOR') as directores,
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

    const genderStats = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN uvp."voiceType" IN ('TENOR', 'BARITONO', 'BAJO') THEN 'Hombres'
          WHEN uvp."voiceType" IN ('SOPRANO', 'CONTRALTO', 'MESOSOPRANO') THEN 'Mujeres'
        END as genero,
        COUNT(DISTINCT uvp."userId") as cantidad
      FROM user_voice_profiles uvp
      WHERE uvp."voiceType" NOT IN ('CORO', 'ORIGINAL')
      GROUP BY genero
    `;

    const activeStats = await prisma.$queryRaw`
      SELECT 
        u."isActive",
        COUNT(*) as cantidad
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur."userId"
      WHERE ur.role = 'CANTANTE'
      GROUP BY u."isActive"
      ORDER BY u."isActive" DESC
    `;

    console.log('\n🎉 ¡Seed definitivo completado exitosamente!');
    console.log('==================================================');
    console.log(`👥 Total usuarios: ${stats[0].total_usuarios}`);
    console.log(`🔑 Administradores: ${stats[0].admins}`);
    console.log(`🎭 Directores: ${stats[0].directores}`);
    console.log(`🎤 Cantantes: ${stats[0].cantantes}`);
    console.log(`📍 Ubicaciones: ${stats[0].ubicaciones}`);
    console.log(`📅 Eventos: ${stats[0].eventos}`);
    
    console.log('\n🎭 Distribución por tipo de voz:');
    voiceStats.forEach((stat) => {
      console.log(`   ${stat.voiceType}: ${stat.cantidad} asignaciones`);
    });

    console.log('\n🏙️ Distribución por ciudad:');
    cityStats.forEach((stat) => {
      console.log(`   ${stat.city}: ${stat.cantantes} cantantes`);
    });

    console.log('\n👫 Distribución por género:');
    genderStats.forEach((stat) => {
      console.log(`   ${stat.genero}: ${stat.cantidad} cantantes`);
    });

    console.log('\n🔄 Estado de usuarios (cantantes):');
    const totalCantantes = activeStats.reduce((sum, stat) => sum + Number(stat.cantidad), 0);
    activeStats.forEach((stat) => {
      const percentage = ((Number(stat.cantidad) / totalCantantes) * 100).toFixed(1);
      const estado = stat.isActive ? 'Activos' : 'Inactivos';
      console.log(`   ${estado}: ${stat.cantidad} cantantes (${percentage}%)`);
    });

    console.log('\n🔐 Credenciales de acceso:');
    console.log('===============================');
    console.log('📧 ADMINISTRADORES:');
    console.log('   admin@cgplayer.com | Contraseña: admin123');
    console.log('   admin.sistema@cgplayer.com | Contraseña: admin2123');
    console.log('\n🎭 DIRECTORES:');
    console.log('   director.santiago1@cgplayer.com | Contraseña: director123');
    console.log('   director.santiago2@cgplayer.com | Contraseña: director123');
    console.log('   director.vinadelmar@cgplayer.com | Contraseña: director123');
    console.log('   director.concepcion@cgplayer.com | Contraseña: director123');
    console.log('   director.antofagasta@cgplayer.com | Contraseña: director123');
    console.log('   director.valdivia@cgplayer.com | Contraseña: director123');
    console.log('\n🎤 CANTANTES:');
    console.log('   [nombre].[apellido]@cgplayer.com | Contraseña: cantante123');
    
    console.log('\n✨ Base de datos lista sin canciones cargadas');
    console.log('🎵 Los usuarios pueden empezar a subir sus canciones');

  } catch (error) {
    console.error('❌ Error al crear seed definitivo:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar seed definitivo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
