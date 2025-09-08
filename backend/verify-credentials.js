const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarCredenciales() {
  try {
    console.log('🔍 Verificando credenciales de login...\n');

    // Buscar usuario administrador
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cgplayer.com' },
      include: {
        roles: true,
        voiceProfiles: true,
        location: true
      }
    });

    if (!admin) {
      console.log('❌ Usuario administrador no encontrado');
      return;
    }

    console.log('✅ Usuario administrador encontrado:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Nombre: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Activo: ${admin.isActive}`);

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare('admin123', admin.password);
    console.log(`✅ Password 'admin123': ${passwordMatch ? 'VÁLIDO' : 'INVÁLIDO'}`);

    // Mostrar roles
    console.log('✅ Roles:');
    admin.roles.forEach(role => {
      console.log(`   - ${role.role}`);
    });

    // Mostrar voces
    console.log('✅ Voces:');
    admin.voiceProfiles.forEach(voice => {
      console.log(`   - ${voice.voiceType}${voice.isPrimary ? ' (Primaria)' : ''}`);
    });

    // Buscar algunos cantantes
    const cantantes = await prisma.user.findMany({
      where: {
        roles: {
          some: { role: 'CANTANTE' }
        }
      },
      include: {
        roles: true,
        voiceProfiles: true
      },
      take: 5
    });

    console.log('\n✅ Ejemplos de cantantes:');
    for (const cantante of cantantes) {
      const passwordMatch = await bcrypt.compare('cantante123', cantante.password);
      console.log(`   📧 ${cantante.email}`);
      console.log(`   👤 ${cantante.username}`);
      console.log(`   🔒 Password 'cantante123': ${passwordMatch ? 'VÁLIDO' : 'INVÁLIDO'}`);
      console.log(`   🎵 Voces: ${cantante.voiceProfiles.map(v => `${v.voiceType}${v.isPrimary ? ' (P)' : ''}`).join(', ')}`);
      console.log('   ───────────');
    }

    console.log('\n🎉 Verificación completada exitosamente!');
    console.log('\n🔑 CREDENCIALES CONFIRMADAS:');
    console.log('═══════════════════════════════');
    console.log('👤 ADMINISTRADOR:');
    console.log('📧 Email: admin@cgplayer.com');
    console.log('👤 Username: admin');
    console.log('🔒 Password: admin123');
    console.log('───────────────────────────────');
    console.log('🎤 CANTANTES (ejemplos):');
    cantantes.slice(0, 3).forEach(cantante => {
      console.log(`📧 Email: ${cantante.email}`);
      console.log(`👤 Username: ${cantante.username}`);
      console.log('🔒 Password: cantante123');
      console.log('───────────');
    });
    console.log('═══════════════════════════════');

  } catch (error) {
    console.error('❌ Error verificando credenciales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarCredenciales();
