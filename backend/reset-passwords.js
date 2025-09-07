// Script para resetear contraseñas después de restaurar un backup
// Ejecutar: node reset-passwords.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAllPasswords() {
  try {
    console.log('🔐 Iniciando reset de contraseñas...');
    
    const defaultPassword = 'cgplayer123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true }
    });
    
    console.log(`📋 Encontrados ${users.length} usuarios`);
    
    // Resetear contraseñas de todos los usuarios
    await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Contraseñas reseteadas exitosamente');
    console.log(`🔑 Nueva contraseña para todos los usuarios: "${defaultPassword}"`);
    console.log('');
    console.log('📋 Usuarios actualizados:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || user.username} - Contraseña: ${defaultPassword}`);
    });
    
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Todos los usuarios pueden loguearse con la contraseña: ' + defaultPassword);
    console.log('   - Los usuarios deben cambiar su contraseña inmediatamente');
    console.log('   - Los administradores pueden gestionar contraseñas desde el panel de admin');
    
  } catch (error) {
    console.error('❌ Error reseteando contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllPasswords();
