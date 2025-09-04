const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔧 Verificando usuario admin...');

    // Buscar el usuario admin
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@cgplayer.local' },
          { username: 'admin_principal' },
          { email: 'admin@cgplayer.com' },
          { username: 'admin' }
        ]
      }
    });

    if (!admin) {
      console.log('❌ No se encontró usuario admin. Creando uno nuevo...');
      
      // Crear ubicación Santiago si no existe
      let location = await prisma.location.findFirst({
        where: { type: 'SANTIAGO' }
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            name: 'Santiago',
            type: 'SANTIAGO',
            address: 'Plaza de Armas',
            city: 'Santiago',
            region: 'Metropolitana',
            color: '#3b82f6'
          }
        });
      }

      // Crear admin
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@cgplayer.local',
          username: 'admin_principal',
          firstName: 'Administrador',
          lastName: 'Principal',
          password: hashedPassword,
          isActive: true,
          locationId: location.id
        }
      });

      // Asignar rol ADMIN
      await prisma.userRole_DB.create({
        data: {
          userId: newAdmin.id,
          role: 'ADMIN'
        }
      });

      console.log('✅ Admin creado exitosamente:');
      console.log('   📧 Email: admin@cgplayer.local');
      console.log('   👤 Username: admin_principal');
      console.log('   🔑 Password: admin123');

    } else {
      console.log('✅ Usuario admin encontrado:', admin.email, '/', admin.username);
      
      // Actualizar contraseña del admin existente
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.user.update({
        where: { id: admin.id },
        data: { 
          password: hashedPassword,
          isActive: true
        }
      });

      console.log('✅ Contraseña actualizada exitosamente:');
      console.log('   📧 Email:', admin.email);
      console.log('   👤 Username:', admin.username);
      console.log('   🔑 Password: admin123');

      // Verificar que tenga rol ADMIN
      const hasAdminRole = await prisma.userRole_DB.findFirst({
        where: {
          userId: admin.id,
          role: 'ADMIN'
        }
      });

      if (!hasAdminRole) {
        await prisma.userRole_DB.create({
          data: {
            userId: admin.id,
            role: 'ADMIN'
          }
        });
        console.log('✅ Rol ADMIN asignado');
      }
    }

    console.log('');
    console.log('🔐 Credenciales de acceso:');
    console.log('   📧 Email: admin@cgplayer.local');
    console.log('   👤 Username: admin_principal');
    console.log('   🔑 Password: admin123');
    console.log('');
    console.log('💡 Puedes usar cualquiera de estos (email o username) para hacer login');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
