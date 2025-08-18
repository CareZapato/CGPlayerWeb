import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetChileanDatabase() {
  try {
    console.log('🔄 Reseteando base de datos con datos chilenos...');

    // Limpiar tablas en orden correcto
    await prisma.userVoiceProfile.deleteMany();
    await prisma.userRole_DB.deleteMany();
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();

    console.log('✅ Base de datos limpiada');

    // Ubicaciones chilenas
    const locations = [
      {
        id: 'loc-santiago',
        name: 'Santiago',
        type: 'SANTIAGO',
        city: 'Santiago',
        address: 'Avenida Providencia 1208, Providencia',
        color: '#3B82F6',
        phone: '+56 2 2234 5678'
      },
      {
        id: 'loc-valparaiso',
        name: 'Valparaíso',
        type: 'VALDIVIA', // Usamos los tipos existentes
        city: 'Valparaíso',
        address: 'Calle Prat 856, Valparaíso',
        color: '#EF4444',
        phone: '+56 32 225 6789'
      },
      {
        id: 'loc-vina-del-mar',
        name: 'Viña del Mar',
        type: 'VINA_DEL_MAR',
        city: 'Viña del Mar',
        address: 'Avenida Libertad 1348, Viña del Mar',
        color: '#10B981',
        phone: '+56 32 268 1234'
      },
      {
        id: 'loc-valdivia',
        name: 'Valdivia',
        type: 'TODOS_LOS_CORISTAS',
        city: 'Valdivia',
        address: 'Calle Independencia 641, Valdivia',
        color: '#F59E0B',
        phone: '+56 63 221 2345'
      },
      {
        id: 'loc-antofagasta',
        name: 'Antofagasta',
        type: 'ANTOFAGASTA',
        city: 'Antofagasta',
        address: 'Avenida Brasil 2556, Antofagasta',
        color: '#8B5CF6',
        phone: '+56 55 226 3456'
      },
      {
        id: 'loc-concepcion',
        name: 'Concepción',
        type: 'CONCEPCION',
        city: 'Concepción',
        address: 'Calle Barros Arana 1052, Concepción',
        color: '#EC4899',
        phone: '+56 41 224 4567'
      }
    ];

    console.log('🏢 Creando ubicaciones chilenas...');
    for (const location of locations) {
      await prisma.location.create({
        data: location as any
      });
      console.log(`   ✅ ${location.name}`);
    }

    // Crear admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    console.log('👨‍💼 Creando administrador...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        isActive: true,
        phone: '+56 9 8765 4321'
      }
    });

    await prisma.userRole_DB.create({
      data: {
        userId: admin.id,
        role: 'ADMIN'
      }
    });

    // Crear directores chilenos
    console.log('👨‍🎓 Creando directores chilenos...');
    const chileanDirectorNames = [
      { first: 'Carlos', last: 'González' },
      { first: 'María', last: 'Rodríguez' },
      { first: 'Pedro', last: 'Martínez' },
      { first: 'Ana', last: 'Silva' },
      { first: 'José', last: 'Muñoz' },
      { first: 'Carmen', last: 'Torres' }
    ];

    const chileanDirectorPhones = [
      '+56 9 8234 5671', '+56 9 8234 5672', '+56 9 8234 5673',
      '+56 9 8234 5674', '+56 9 8234 5675', '+56 9 8234 5676'
    ];
    
    for (let i = 0; i < locations.length; i++) {
      const director = await prisma.user.create({
        data: {
          email: `director${i + 1}@cgplayer.com`,
          username: `director${i + 1}`,
          password: hashedPassword,
          firstName: chileanDirectorNames[i].first,
          lastName: chileanDirectorNames[i].last,
          isActive: true,
          locationId: locations[i].id,
          phone: chileanDirectorPhones[i]
        }
      });

      // Director role
      await prisma.userRole_DB.create({
        data: {
          userId: director.id,
          role: 'DIRECTOR'
        }
      });

      // También puede ser cantante
      await prisma.userRole_DB.create({
        data: {
          userId: director.id,
          role: 'CANTANTE'
        }
      });

      // Asignar tipo de voz al director
      const directorVoiceTypes = ['TENOR', 'BARITONO', 'SOPRANO', 'MESOSOPRANO', 'BAJO', 'CONTRALTO'];
      await prisma.userVoiceProfile.create({
        data: {
          userId: director.id,
          voiceType: directorVoiceTypes[i] as any
        }
      });

      console.log(`   ✅ Director ${director.firstName} ${director.lastName} - ${locations[i].name}`);
    }

    // Nombres chilenos
    const chileanFirstNames = [
      'María', 'José', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Rosa', 'Jorge', 'Luz',
      'Miguel', 'Gloria', 'Francisco', 'Isabel', 'Rafael', 'Martha', 'Andrés', 'Patricia',
      'David', 'Esperanza', 'Fernando', 'Sandra', 'Ricardo', 'Claudia', 'Alejandro', 'Mónica',
      'Gustavo', 'Liliana', 'Javier', 'Diana', 'Edgar', 'Adriana', 'Nelson', 'Beatriz',
      'Hernán', 'Marcela', 'Jaime', 'Cristina', 'Óscar', 'Pilar', 'Rubén', 'Teresa',
      'Álvaro', 'Olga', 'Sergio', 'Blanca', 'Gonzalo', 'Amparo', 'Mauricio', 'Cecilia',
      'Roberto', 'Lucía', 'Arturo', 'Dolores', 'Rodrigo', 'Consuelo', 'Alberto', 'Mercedes',
      'Juan', 'Rocío', 'Pablo', 'Soledad', 'Ramón', 'Ángela', 'Antonio', 'Josefa',
      'Manuel', 'Victoria', 'Raúl', 'Esperanza', 'Eduardo', 'Francisca', 'Víctor', 'Alejandra'
    ];

    const chileanLastNames = [
      'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez',
      'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya',
      'Flores', 'Espinoza', 'Valdés', 'Castillo', 'Tapia', 'Reyes', 'Herrera', 'Vargas',
      'Núñez', 'Santander', 'Cáceres', 'Alarcón', 'Pizarro', 'Vera', 'Ruiz', 'Cortés',
      'Henríquez', 'Garrido', 'Figueroa', 'Sánchez', 'Aguilera', 'Guerrero', 'Medina',
      'Ramos', 'Vásquez', 'Bravo', 'Carrasco', 'Rubio', 'Ortega', 'Molina', 'Campos'
    ];

    const voiceTypes = ['SOPRANO', 'MESOSOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO'];
    
    // Distribución de cantantes por ciudad
    const distribution = [
      { locationId: 'loc-santiago', count: 110 },
      { locationId: 'loc-valparaiso', count: 45 },
      { locationId: 'loc-vina-del-mar', count: 38 },
      { locationId: 'loc-valdivia', count: 35 },
      { locationId: 'loc-antofagasta', count: 50 },
      { locationId: 'loc-concepcion', count: 60 }
    ];

    console.log('🎤 Creando cantantes chilenos...');
    let totalSingerCount = 0;
    
    for (const { locationId, count } of distribution) {
      const location = locations.find(loc => loc.id === locationId);
      console.log(`   📍 ${location?.name}: creando ${count} cantantes`);
      
      for (let i = 0; i < count; i++) {
        const firstName = chileanFirstNames[(totalSingerCount + i) % chileanFirstNames.length];
        const lastName = chileanLastNames[(totalSingerCount + i + 13) % chileanLastNames.length];
        const isActive = Math.random() > 0.1; // 90% activos
        
        // Generar número chileno
        const phoneIndex = totalSingerCount + i + 100; // offset para no repetir con directores
        const phone = `+56 9 ${String(80000000 + (phoneIndex * 123) % 19999999).padStart(8, '0')}`;
        
        const singer = await prisma.user.create({
          data: {
            email: `cantante${totalSingerCount + i + 1}@cgplayer.com`,
            username: `cantante${totalSingerCount + i + 1}`,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            isActive: isActive,
            locationId: locationId,
            phone: phone
          }
        });

        await prisma.userRole_DB.create({
          data: {
            userId: singer.id,
            role: 'CANTANTE'
          }
        });

        // Asignar tipo de voz
        const voiceType = voiceTypes[Math.floor(Math.random() * voiceTypes.length)];
        await prisma.userVoiceProfile.create({
          data: {
            userId: singer.id,
            voiceType: voiceType as any
          }
        });

        if ((i + 1) % 20 === 0) {
          console.log(`     ✅ ${location?.name}: ${i + 1}/${count} cantantes`);
        }
      }
      
      totalSingerCount += count;
    }

    console.log('📊 Resumen final:');
    const totalUsers = await prisma.user.count();
    const totalLocations = await prisma.location.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    
    console.log(`   • ${totalUsers} usuarios totales (${activeUsers} activos)`);
    console.log(`   • ${totalLocations} ubicaciones chilenas`);
    console.log(`   • 288 cantantes distribuidos según especificación`);
    console.log(`   • 6 directores (que también son cantantes)`);
    console.log('✅ Database reset chileno completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetChileanDatabase();
