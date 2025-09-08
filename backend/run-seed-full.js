const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Función para determinar el género basado en el nombre
function determinarGenero(nombre) {
  const nombresHombres = [
    'Carlos', 'José', 'Antonio', 'Manuel', 'Francisco', 'David', 'Javier', 'Rafael', 'Miguel', 'Ángel',
    'Pedro', 'Luis', 'Pablo', 'Diego', 'Alejandro', 'Fernando', 'Sergio', 'Andrés', 'Roberto', 'Ramón',
    'Juan', 'Gonzalo', 'Eduardo', 'Ignacio', 'Sebastián', 'Cristián', 'Marcelo', 'Ricardo', 'Rodrigo', 'Daniel',
    'Guillermo', 'Patricio', 'Héctor', 'Iván', 'Claudio', 'Mauricio', 'Jorge', 'Álvaro', 'Raúl', 'Fabián',
    'Hugo', 'Óscar', 'Nicolás', 'Víctor', 'César', 'Emilio', 'Gabriel', 'Jaime', 'Leonardo', 'Felipe',
    'Bernardo', 'Marco', 'Orlando', 'Valentín', 'Tomás', 'Matías', 'Simón', 'Esteban', 'Joaquín', 'Lorenzo'
  ];
  
  return nombresHombres.includes(nombre.split(' ')[0]) ? 'MASCULINO' : 'FEMENINO';
}

// Función para obtener voces por cantante según su género
function obtenerVocesPorCantante(genero) {
  const vocesFemeninas = ['SOPRANO', 'MESOSOPRANO', 'CONTRALTO'];
  const vocesMasculinas = ['TENOR', 'BARITONO', 'BAJO'];
  
  const vocesDisponibles = genero === 'MASCULINO' ? vocesMasculinas : vocesFemeninas;
  
  // 30% de cantantes tendrán múltiples voces (2-3 voces)
  const tieneMultiplesVoces = Math.random() < 0.3;
  
  if (tieneMultiplesVoces) {
    // Seleccionar 2 o 3 voces de forma coherente
    const numVoces = Math.random() < 0.6 ? 2 : 3; // 60% con 2 voces, 40% con 3 voces
    
    // Asegurar que seleccionamos voces diferentes
    const vocesSeleccionadas = [];
    const vocesRestantes = [...vocesDisponibles];
    
    for (let i = 0; i < Math.min(numVoces, vocesRestantes.length); i++) {
      const indiceAleatorio = Math.floor(Math.random() * vocesRestantes.length);
      vocesSeleccionadas.push(vocesRestantes.splice(indiceAleatorio, 1)[0]);
    }
    
    return vocesSeleccionadas;
  } else {
    // Una sola voz
    return [vocesDisponibles[Math.floor(Math.random() * vocesDisponibles.length)]];
  }
}

// Lista de nombres para generar cantantes
const nombresCantantes = [
  // Nombres femeninos
  'María González', 'Ana López', 'Carmen Rodríguez', 'Isabel Martínez', 'Laura Sánchez',
  'Patricia Gómez', 'Rosa Fernández', 'Elena Ruiz', 'Lucía Díaz', 'Marta Moreno',
  'Pilar Castro', 'Teresa Jiménez', 'Esperanza Álvarez', 'Dolores Romero', 'Inmaculada Torres',
  'Cristina Ramírez', 'Silvia Flores', 'Andrea Herrera', 'Beatriz Peña', 'Mónica Guerrero',
  'Nuria Medina', 'Rocío Cortés', 'Amparo Garrido', 'Remedios Santos', 'Marisol Iglesias',
  'Victoria Lozano', 'Antonia Rubio', 'Francisca Marín', 'Josefa Delgado', 'Encarnación Vázquez',
  'Mercedes Morales', 'Concepción Ortiz', 'Milagros Serrano', 'Soledad Blanco', 'Asunción Moyano',
  'Purificación Prieto', 'Presentación Ortega', 'Consuelo Hidalgo', 'Angustias Pascual', 'Sacramento Aguilar',
  'Visitación Benítez', 'Consolación Vargas', 'Esperanza Contreras', 'Paz Domínguez', 'Fe Herrero',
  'Caridad Campos', 'Paloma Vidal', 'Estrella Ibáñez', 'Aurora Caballero', 'Nieves Ferrer',
  'Luz Esteban', 'Gloria Montero', 'Angeles Santiago', 'Rosario Vega', 'Amparo Lorenzo',
  'Socorro Román', 'Alegría Soler', 'Gracia Cano', 'Esperanza Prieto', 'Caridad Ortega',
  'Milagros Herrero', 'Remedios Campos', 'Dolores Vidal', 'Encarnación Ibáñez', 'Mercedes Caballero',
  'Concepción Ferrer', 'Visitación Esteban', 'Purificación Montero', 'Presentación Santiago', 'Consuelo Vega',
  'Asunción Lorenzo', 'Soledad Román', 'Antonia Soler', 'Francisca Cano', 'Josefa Prieto',
  'Victoria Ortega', 'Marisol Herrero', 'Amparo Campos', 'Rocío Vidal', 'Nuria Ibáñez',
  'Mónica Caballero', 'Beatriz Ferrer', 'Andrea Esteban', 'Silvia Montero', 'Cristina Santiago',
  'Inmaculada Vega', 'Dolores Lorenzo', 'Teresa Román', 'Pilar Soler', 'Marta Cano',
  'Lucía Prieto', 'Elena Ortega', 'Rosa Herrero', 'Patricia Campos', 'Laura Vidal',
  'Isabel Ibáñez', 'Carmen Caballero', 'Ana Ferrer', 'María Esteban', 'Esperanza Montero',
  'Paz Santiago', 'Fe Vega', 'Caridad Lorenzo', 'Paloma Román', 'Estrella Soler',
  'Aurora Cano', 'Nieves Prieto', 'Luz Ortega', 'Gloria Herrero', 'Angeles Campos',
  'Rosario Vidal', 'Amparo Ibáñez', 'Socorro Caballero', 'Alegría Ferrer', 'Gracia Esteban',

  // Nombres masculinos
  'Carlos Martín', 'José García', 'Antonio Hernández', 'Manuel Jiménez', 'Francisco Álvarez',
  'David Romero', 'Javier Torres', 'Rafael Ramírez', 'Miguel Flores', 'Ángel Herrera',
  'Pedro Peña', 'Luis Guerrero', 'Pablo Medina', 'Diego Cortés', 'Alejandro Garrido',
  'Fernando Santos', 'Sergio Iglesias', 'Andrés Lozano', 'Roberto Rubio', 'Ramón Marín',
  'Juan Delgado', 'Gonzalo Vázquez', 'Eduardo Morales', 'Ignacio Ortiz', 'Sebastián Serrano',
  'Cristián Blanco', 'Marcelo Moyano', 'Ricardo Prieto', 'Rodrigo Ortega', 'Daniel Hidalgo',
  'Guillermo Pascual', 'Patricio Aguilar', 'Héctor Benítez', 'Iván Vargas', 'Claudio Contreras',
  'Mauricio Domínguez', 'Jorge Herrero', 'Álvaro Campos', 'Raúl Vidal', 'Fabián Ibáñez',
  'Hugo Caballero', 'Óscar Ferrer', 'Nicolás Esteban', 'Víctor Montero', 'César Santiago',
  'Emilio Vega', 'Gabriel Lorenzo', 'Jaime Román', 'Leonardo Soler', 'Felipe Cano',
  'Bernardo Prieto', 'Marco Ortega', 'Orlando Herrero', 'Valentín Campos', 'Tomás Vidal',
  'Matías Ibáñez', 'Simón Caballero', 'Esteban Ferrer', 'Joaquín Esteban', 'Lorenzo Montero',
  'Enrique Santiago', 'Salvador Vega', 'Domingo Lorenzo', 'Julián Román', 'Aurelio Soler',
  'Bautista Cano', 'Clemente Prieto', 'Damián Ortega', 'Elías Herrero', 'Florencio Campos',
  'Gregorio Vidal', 'Hilario Ibáñez', 'Isidoro Caballero', 'Jacinto Ferrer', 'Leandro Esteban',
  'Máximo Montero', 'Norberto Santiago', 'Octavio Vega', 'Plácido Lorenzo', 'Quintín Román',
  'Raimundo Soler', 'Segundo Cano', 'Tiburcio Prieto', 'Ulises Ortega', 'Venancio Herrero',
  'Wenceslao Campos', 'Ximeno Vidal', 'Yago Ibáñez', 'Zacarías Caballero', 'Abundio Ferrer',
  'Bartolomé Esteban', 'Cayetano Montero', 'Demetrio Santiago', 'Evaristo Vega', 'Fulgencio Lorenzo'
];

async function seedFull() {
  try {
    console.log('🌱 Iniciando seed completo con 300+ cantantes...\n');

    // Limpiar datos existentes
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

    // 1. Crear ubicaciones
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: 'Catedral Santiago',
          type: 'SANTIAGO',
          address: 'Plaza de Armas s/n',
          city: 'Santiago',
          region: 'Metropolitana',
          country: 'Chile',
          color: '#FF6B6B'
        }
      }),
      prisma.location.create({
        data: {
          name: 'Iglesia Valparaíso',
          type: 'VINA_DEL_MAR',
          address: 'Cerro Alegre 123',
          city: 'Valparaíso',
          region: 'Valparaíso',
          country: 'Chile',
          color: '#4ECDC4'
        }
      }),
      prisma.location.create({
        data: {
          name: 'Templo Viña del Mar',
          type: 'VINA_DEL_MAR',
          address: 'Av. Libertad 456',
          city: 'Viña del Mar',
          region: 'Valparaíso',
          country: 'Chile',
          color: '#45B7D1'
        }
      })
    ]);

    console.log(`✅ Ubicaciones creadas: ${locations.map(l => l.name).join(', ')}`);

    // 2. Crear administrador
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@cgplayer.com',
        username: 'admin',
        password: '$2b$10$K8JVv5z5rq5oX5x8k5z5ruu5z5z5z5z5z5z5z5z5z5z5z5z5z5z5',
        firstName: 'Administrador',
        lastName: 'Sistema',
        locationId: locations[0].id,
        phone: '+56912345678'
      }
    });

    await prisma.userRole_DB.create({
      data: {
        userId: adminUser.id,
        role: 'ADMIN'
      }
    });

    console.log(`✅ Usuario administrador creado: ${adminUser.firstName}`);

    // 3. Crear directores
    const director1 = await prisma.user.create({
      data: {
        email: 'director1@cgplayer.com',
        username: 'director1',
        password: '$2b$10$K8JVv5z5rq5oX5x8k5z5ruu5z5z5z5z5z5z5z5z5z5z5z5z5z5z5',
        firstName: 'María Elena',
        lastName: 'Directora',
        locationId: locations[0].id,
        phone: '+56987654321'
      }
    });

    const director2 = await prisma.user.create({
      data: {
        email: 'director2@cgplayer.com',
        username: 'director2',
        password: '$2b$10$K8JVv5z5rq5oX5x8k5z5ruu5z5z5z5z5z5z5z5z5z5z5z5z5z5z5',
        firstName: 'José Antonio',
        lastName: 'Director',
        locationId: locations[1].id,
        phone: '+56976543210'
      }
    });

    // Asignar roles y voces a directores
    await Promise.all([
      prisma.userRole_DB.create({ data: { userId: director1.id, role: 'DIRECTOR' } }),
      prisma.userRole_DB.create({ data: { userId: director2.id, role: 'DIRECTOR' } }),
      prisma.userVoiceProfile.create({ 
        data: { 
          userId: director1.id, 
          voiceType: 'SOPRANO',
          isPrimary: true,
          assignedBy: adminUser.id 
        } 
      }),
      prisma.userVoiceProfile.create({ 
        data: { 
          userId: director2.id, 
          voiceType: 'BARITONO',
          isPrimary: true,
          assignedBy: adminUser.id 
        } 
      })
    ]);

    console.log('✅ Directores creados con voces asignadas');

    // 4. Crear cantantes con sistema de voz primaria
    let cantantesCreados = 0;
    let usuariosConMultiplesVoces = 0;
    const totalCantantes = 320; // Crear más de 300 cantantes

    console.log(`\n🎤 Creando ${totalCantantes} cantantes...`);

    for (let i = 0; i < totalCantantes; i++) {
      // Usar nombres de la lista, repetir si es necesario
      const nombreCompleto = nombresCantantes[i % nombresCantantes.length] + (i >= nombresCantantes.length ? ` ${Math.floor(i / nombresCantantes.length) + 1}` : '');
      const [firstName, ...lastNameParts] = nombreCompleto.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const genero = determinarGenero(firstName);
      const vocesAsignadas = obtenerVocesPorCantante(genero);
      
      try {
        // Crear usuario cantante
        const cantante = await prisma.user.create({
          data: {
            email: `cantante${i + 1}@cgplayer.com`,
            username: `cantante${i + 1}`,
            password: '$2b$10$K8JVv5z5rq5oX5x8k5z5ruu5z5z5z5z5z5z5z5z5z5z5z5z5z5z5',
            firstName: firstName,
            lastName: lastName,
            locationId: locations[i % locations.length].id,
            phone: `+569${Math.floor(Math.random() * 90000000) + 10000000}`
          }
        });

        // Asignar rol de cantante
        await prisma.userRole_DB.create({
          data: {
            userId: cantante.id,
            role: 'CANTANTE',
            assignedBy: adminUser.id
          }
        });

        // Asignar voces con una marcada como primaria
        const vozPrimaria = vocesAsignadas[0]; // La primera voz será la primaria

        for (let j = 0; j < vocesAsignadas.length; j++) {
          await prisma.userVoiceProfile.create({
            data: {
              userId: cantante.id,
              voiceType: vocesAsignadas[j],
              isPrimary: j === 0, // Solo la primera voz es primaria
              assignedBy: adminUser.id
            }
          });
        }

        cantantesCreados++;
        if (vocesAsignadas.length > 1) {
          usuariosConMultiplesVoces++;
        }

        // Mostrar progreso cada 50 cantantes
        if (cantantesCreados % 50 === 0) {
          console.log(`✅ ${cantantesCreados} cantantes creados...`);
        }

      } catch (error) {
        console.error(`❌ Error creando cantante ${i + 1}:`, error.message);
      }
    }

    console.log(`✅ Total de ${cantantesCreados} cantantes creados con sistema de voz primaria`);

    // 5. Crear algunos eventos
    const evento1 = await prisma.event.create({
      data: {
        title: 'Concierto de Navidad 2024',
        description: 'Celebración navideña con el coro completo',
        date: new Date('2024-12-24T20:00:00Z'),
        locationId: locations[0].id,
        createdBy: adminUser.id,
        isActive: true
      }
    });

    const evento2 = await prisma.event.create({
      data: {
        title: 'Ensayo General - Semana Santa',
        description: 'Preparación para las ceremonias de Semana Santa',
        date: new Date('2024-03-25T19:00:00Z'),
        locationId: locations[1].id,
        createdBy: adminUser.id,
        isActive: true
      }
    });

    console.log(`✅ Eventos creados: ${evento1.title} ${evento2.title}`);

    // 6. Crear algunas inscripciones a eventos
    const todosLosCantantes = await prisma.user.findMany({
      where: { 
        roles: { 
          some: { role: 'CANTANTE' } 
        } 
      },
      take: 50 // Solo los primeros 50 para no saturar
    });

    const statuses = ['CONFIRMED', 'CANCELLED', 'NO_SHOW'];

    for (const cantante of todosLosCantantes.slice(0, 30)) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      try {
        await prisma.eventAttendee.create({
          data: {
            eventId: evento1.id,
            userId: cantante.id,
            addedBy: adminUser.id,
            status: randomStatus,
            attendanceConfirmed: randomStatus === 'CONFIRMED' ? true : null,
            nonAttendanceComment: randomStatus === 'CANCELLED' ? 'Conflicto de horario' : null
          }
        });
      } catch (error) {
        // Ignorar duplicados
      }
    }

    console.log('✅ Asistentes y solicitudes de unión creadas para los eventos');

    // 7. Mostrar estadísticas finales
    console.log('\n📊 Estadísticas de voces:');
    
    const estadisticasVoces = await prisma.userVoiceProfile.groupBy({
      by: ['voiceType'],
      _count: {
        voiceType: true
      },
      orderBy: {
        _count: {
          voiceType: 'desc'
        }
      }
    });

    const vocesPrimarias = await prisma.userVoiceProfile.groupBy({
      by: ['voiceType'],
      where: {
        isPrimary: true
      },
      _count: {
        voiceType: true
      },
      orderBy: {
        _count: {
          voiceType: 'desc'
        }
      }
    });

    console.log('Total de asignaciones de voz:', estadisticasVoces);
    console.log('Voces primarias:', vocesPrimarias);

    const porcentajeMultiplesVoces = ((usuariosConMultiplesVoces / cantantesCreados) * 100).toFixed(1);
    console.log(`👥 Usuarios con múltiples voces: ${usuariosConMultiplesVoces} (${porcentajeMultiplesVoces}%)`);

    console.log('\n🎉 Seed completado exitosamente!');
    console.log(`✅ Creados: 3 ubicaciones, 1 admin, 2 directores, ${cantantesCreados} cantantes, 2 eventos`);

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedFull()
  .then(() => {
    console.log('\n✅ Seed full completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando seed full:', error);
    process.exit(1);
  });
