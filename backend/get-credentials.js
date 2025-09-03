const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAllCredentials() {
  try {
    console.log('🔐 CREDENCIALES DE ACCESO - CGPlayerWeb');
    console.log('================================================\n');
    
    // 1. ADMINISTRADORES
    console.log('👑 ADMINISTRADORES:');
    console.log('==================');
    const admins = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'ADMIN'
          }
        }
      },
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    admins.forEach(admin => {
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Usuario: ${admin.username}`);
      console.log(`📝 Nombre: ${admin.firstName} ${admin.lastName}`);
      console.log(`🔒 Contraseña: admin123`);
      console.log(`✅ Estado: ${admin.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('---');
    });

    // 2. DIRECTORES
    console.log('\n🎭 DIRECTORES:');
    console.log('==============');
    const directores = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'DIRECTOR'
          }
        }
      },
      include: {
        location: true
      }
    });

    directores.forEach(director => {
      console.log(`📧 Email: ${director.email}`);
      console.log(`👤 Usuario: ${director.username}`);
      console.log(`📝 Nombre: ${director.firstName} ${director.lastName}`);
      console.log(`🔒 Contraseña: director123`);
      console.log(`📍 Ubicación: ${director.location?.city || 'Sin asignar'}`);
      console.log(`✅ Estado: ${director.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('---');
    });

    // 3. CANTANTES (muestra de 20 cantantes con sus voces)
    console.log('\n🎤 CANTANTES (Muestra de 20):');
    console.log('==============================');
    const cantantes = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'CANTANTE'
          }
        }
      },
      include: {
        location: true,
        voiceProfiles: {
          select: {
            voiceType: true
          }
        }
      },
      take: 20,
      orderBy: {
        firstName: 'asc'
      }
    });

    cantantes.forEach(cantante => {
      const voces = cantante.voiceProfiles
        .map(vp => vp.voiceType)
        .join(', ');
      
      console.log(`📧 Email: ${cantante.email}`);
      console.log(`👤 Usuario: ${cantante.username}`);
      console.log(`📝 Nombre: ${cantante.firstName} ${cantante.lastName}`);
      console.log(`🔒 Contraseña: cantante123`);
      console.log(`🎵 Voces: ${voces || 'Sin asignar'}`);
      console.log(`📍 Ubicación: ${cantante.location?.city || 'Sin asignar'}`);
      console.log(`✅ Estado: ${cantante.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('---');
    });

    // 4. ESTADÍSTICAS POR TIPO DE VOZ
    console.log('\n📊 RESUMEN POR TIPO DE VOZ:');
    console.log('============================');
    const voiceStats = await prisma.$queryRaw`
      SELECT 
        uvp."voiceType", 
        COUNT(DISTINCT u.id) as cantantes,
        COUNT(DISTINCT CASE WHEN u."isActive" = true THEN u.id END) as activos
      FROM user_voice_profiles uvp
      INNER JOIN users u ON uvp."userId" = u.id
      INNER JOIN user_roles ur ON u.id = ur."userId"
      WHERE ur.role = 'CANTANTE'
      GROUP BY uvp."voiceType"
      ORDER BY cantantes DESC
    `;

    voiceStats.forEach(stat => {
      console.log(`🎵 ${stat.voiceType}: ${stat.cantantes} cantantes (${stat.activos} activos)`);
    });

    // 5. USUARIOS DE PRUEBA ESPECÍFICOS
    console.log('\n🔧 USUARIOS DE PRUEBA POR CIUDAD:');
    console.log('==================================');
    
    const ciudades = ['Santiago', 'Viña del Mar', 'Concepción', 'Antofagasta', 'Valdivia'];
    
    for (const ciudad of ciudades) {
      console.log(`\n📍 ${ciudad.toUpperCase()}:`);
      
      const usuariosCiudad = await prisma.user.findMany({
        where: {
          location: {
            city: ciudad
          },
          roles: {
            some: {
              role: 'CANTANTE'
            }
          }
        },
        include: {
          voiceProfiles: {
            select: {
              voiceType: true
            }
          }
        },
        take: 3,
        orderBy: {
          firstName: 'asc'
        }
      });

      usuariosCiudad.forEach(usuario => {
        const voces = usuario.voiceProfiles.map(vp => vp.voiceType).join(', ');
        console.log(`   👤 ${usuario.firstName} ${usuario.lastName}`);
        console.log(`   📧 ${usuario.email}`);
        console.log(`   🎵 ${voces}`);
        console.log(`   🔒 cantante123`);
        console.log('   ---');
      });
    }

    // 6. CREDENCIALES RÁPIDAS
    console.log('\n⚡ ACCESO RÁPIDO:');
    console.log('==================');
    console.log('🔑 ADMIN PRINCIPAL:');
    console.log('   📧 admin@cgplayer.com');
    console.log('   🔒 admin123');
    console.log('');
    console.log('🎭 DIRECTOR SANTIAGO:');
    console.log('   📧 director.santiago1@cgplayer.com');
    console.log('   🔒 director123');
    console.log('');
    console.log('🎤 CANTANTE EJEMPLO:');
    console.log('   📧 [usar cualquiera de la lista arriba]');
    console.log('   🔒 cantante123');

  } catch (error) {
    console.error('❌ Error obteniendo credenciales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllCredentials();
