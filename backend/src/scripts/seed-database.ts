import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Sembrando datos de prueba...');
    
    // Verificar si ya existe el usuario admin
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@cgplayer.com' }
    });
    
    if (!adminUser) {
      console.log('👤 Creando usuario administrador...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@cgplayer.com',
          username: 'admin',
          password: hashedPassword,
          firstName: 'Administrador',
          lastName: 'Sistema',
          role: 'ADMIN'
        }
      });
    }
    
    // Crear algunos usuarios de cantantes
    console.log('🎤 Creando usuarios cantantes...');
    const singers = [
      { email: 'soprano1@coro.com', username: 'soprano1', firstName: 'María', lastName: 'González' },
      { email: 'contralto1@coro.com', username: 'contralto1', firstName: 'Ana', lastName: 'Martínez' },
      { email: 'tenor1@coro.com', username: 'tenor1', firstName: 'Carlos', lastName: 'López' },
      { email: 'baritono1@coro.com', username: 'baritono1', firstName: 'Luis', lastName: 'Rodríguez' },
      { email: 'bajo1@coro.com', username: 'bajo1', firstName: 'Miguel', lastName: 'Fernández' }
    ];
    
    const defaultPassword = await bcrypt.hash('cantante123', 10);
    
    for (const singerData of singers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: singerData.email }
      });
      
      if (!existingUser) {
        await prisma.user.create({
          data: {
            ...singerData,
            password: defaultPassword,
            role: 'SINGER'
          }
        });
        console.log(`   ✅ ${singerData.firstName} ${singerData.lastName} (SINGER)`);
      }
    }
    
    console.log('✅ Datos de prueba sembrados exitosamente');
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log('   👑 Admin: admin@cgplayer.com / admin123');
    console.log('   🎤 Cantantes: [nombre]@coro.com / cantante123');
    console.log('');
    
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuarios: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
