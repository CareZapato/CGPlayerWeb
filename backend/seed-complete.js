const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Función para determinar el género basado en el nombre
function determinarGenero(nombre) {
  const nombresHombres = [
    'Carlos', 'José', 'Antonio', 'Manuel', 'Francisco', 'David', 'Javier', 'Rafael', 'Miguel', 'Ángel',
    'Pedro', 'Luis', 'Pablo', 'Diego', 'Alejandro', 'Fernando', 'Sergio', 'Andrés', 'Roberto', 'Ramón'
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

async function seedCompleto() {
  try {
    console.log('🌱 Iniciando seed completo con credenciales válidas...\n');

    // Verificar si ya existe el admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@cgplayer.com' }
    });

    if (existingAdmin) {
      console.log('✅ Administrador ya existe, continuando con cantantes...');
    } else {
      console.log('❌ Administrador no existe. Ejecute primero create-admin-credentials.js');
      return;
    }

    // Obtener ubicaciones
    const locations = await prisma.location.findMany();
    if (locations.length === 0) {
      console.log('❌ No hay ubicaciones. Ejecute primero create-admin-credentials.js');
      return;
    }

    // Crear cantantes adicionales
    const nombresCantantes = [
      // Nombres femeninos
      'María González', 'Ana López', 'Carmen Rodríguez', 'Isabel Martínez', 'Laura Sánchez',
      'Patricia Gómez', 'Rosa Fernández', 'Elena Ruiz', 'Lucía Díaz', 'Marta Moreno',
      'Pilar Castro', 'Teresa Jiménez', 'Esperanza Álvarez', 'Dolores Romero', 'Inmaculada Torres',
      'Cristina Ramírez', 'Silvia Flores', 'Andrea Herrera', 'Beatriz Peña', 'Mónica Guerrero',
      
      // Nombres masculinos
      'Carlos Martín', 'José García', 'Antonio Hernández', 'Manuel Jiménez', 'Francisco Álvarez',
      'David Romero', 'Javier Torres', 'Rafael Ramírez', 'Miguel Flores', 'Ángel Herrera',
      'Pedro Peña', 'Luis Guerrero', 'Pablo Medina', 'Diego Cortés', 'Alejandro Garrido',
      'Fernando Santos', 'Sergio Iglesias', 'Andrés Lozano', 'Roberto Rubio', 'Ramón Marín'
    ];

    const saltRounds = 10;
    let cantantesCreados = 0;
    let usuariosConMultiplesVoces = 0;

    console.log(`🎤 Agregando ${nombresCantantes.length} cantantes con voz primaria...`);

    for (let i = 0; i < nombresCantantes.length; i++) {
      const nombreCompleto = nombresCantantes[i];
      const [firstName, ...lastNameParts] = nombreCompleto.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const genero = determinarGenero(firstName);
      const vocesAsignadas = obtenerVocesPorCantante(genero);
      
      try {
        // Generar password hash
        const plainPassword = 'cantante123';
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        // Crear usuario cantante
        const cantante = await prisma.user.create({
          data: {
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@cgplayer.com`,
            username: `${firstName.toLowerCase()}${i + 1}`,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            locationId: locations[i % locations.length].id,
            phone: `+569${Math.floor(Math.random() * 90000000) + 10000000}`,
            isActive: true
          }
        });

        // Asignar rol de cantante
        await prisma.userRole_DB.create({
          data: {
            userId: cantante.id,
            role: 'CANTANTE',
            assignedBy: existingAdmin.id
          }
        });

        // Asignar voces con una marcada como primaria
        for (let j = 0; j < vocesAsignadas.length; j++) {
          await prisma.userVoiceProfile.create({
            data: {
              userId: cantante.id,
              voiceType: vocesAsignadas[j],
              isPrimary: j === 0, // Solo la primera voz es primaria
              assignedBy: existingAdmin.id
            }
          });
        }

        cantantesCreados++;
        if (vocesAsignadas.length > 1) {
          usuariosConMultiplesVoces++;
        }

        console.log(`✅ Cantante ${cantantesCreados}: ${firstName} ${lastName} - Voces: ${vocesAsignadas.join(', ')} (Primaria: ${vocesAsignadas[0]})`);

      } catch (error) {
        console.log(`⚠️  Cantante ${nombreCompleto} ya existe, saltando...`);
      }
    }

    // Crear algunos eventos
    try {
      const evento1 = await prisma.event.create({
        data: {
          title: 'Concierto de Navidad 2025',
          description: 'Celebración navideña con el coro completo',
          date: new Date('2025-12-24T20:00:00Z'),
          locationId: locations[0].id,
          createdBy: existingAdmin.id,
          isActive: true
        }
      });

      const evento2 = await prisma.event.create({
        data: {
          title: 'Ensayo General - Pascua',
          description: 'Preparación para las ceremonias de Pascua',
          date: new Date('2025-03-30T19:00:00Z'),
          locationId: locations[0].id,
          createdBy: existingAdmin.id,
          isActive: true
        }
      });

      console.log(`✅ Eventos creados: ${evento1.title}, ${evento2.title}`);
    } catch (error) {
      console.log('⚠️  Eventos ya existen, saltando...');
    }

    // Mostrar estadísticas finales
    const totalUsuarios = await prisma.user.count();
    const totalCantantes = await prisma.user.count({
      where: {
        roles: {
          some: { role: 'CANTANTE' }
        }
      }
    });

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

    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log(`👥 Total usuarios: ${totalUsuarios}`);
    console.log(`🎤 Total cantantes: ${totalCantantes}`);
    console.log('🎵 Asignaciones de voz:', estadisticasVoces);
    console.log('⭐ Voces primarias:', vocesPrimarias);

    const porcentajeMultiplesVoces = ((usuariosConMultiplesVoces / cantantesCreados) * 100).toFixed(1);
    console.log(`🎭 Cantantes con múltiples voces: ${usuariosConMultiplesVoces} (${porcentajeMultiplesVoces}%)`);

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n🔑 CREDENCIALES DE LOGIN:');
    console.log('═══════════════════════════════');
    console.log('👤 ADMINISTRADOR:');
    console.log('📧 Email: admin@cgplayer.com');
    console.log('👤 Username: admin');
    console.log('🔒 Password: admin123');
    console.log('───────────────────────────────');
    console.log('🎤 CANTANTES:');
    console.log('📧 Email: [nombre].[apellido]@cgplayer.com');
    console.log('👤 Username: [nombre][numero]');
    console.log('🔒 Password: cantante123');
    console.log('Ejemplo: maria1 / cantante123');
    console.log('═══════════════════════════════');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedCompleto()
  .then(() => {
    console.log('\n✅ Seed completo exitoso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando seed completo:', error);
    process.exit(1);
  });
