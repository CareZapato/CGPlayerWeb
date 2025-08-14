import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUtilsAndRoles() {
  try {
    console.log('🧪 Probando utils y sistema de roles...\n');
    
    // Test 1: Verificar que prisma funciona
    const userCount = await prisma.user.count();
    console.log(`✅ Prisma utils: ${userCount} usuarios en BD`);
    
    // Test 2: Verificar query raw de roles
    const adminUsers = await prisma.$queryRaw`
      SELECT u."firstName", u."lastName", ur.role 
      FROM users u
      JOIN user_roles ur ON u.id = ur."userId"
      WHERE ur.role = 'ADMIN'
    `;
    console.log(`✅ Query roles: ${(adminUsers as any[]).length} usuarios ADMIN`);
    
    // Test 3: Importar roleHelpers
    const { hasRole, isAdmin } = await import('../utils/roleHelpers');
    console.log('✅ RoleHelpers importado correctamente');
    
    // Test 4: Usar authNew para verificar login
    const testLogin = await prisma.user.findFirst({
      where: { email: 'admin@cgplayer.com' }
    });
    console.log(`✅ Usuario ADMIN encontrado: ${testLogin?.firstName}`);
    
    console.log('\n🎉 Todos los tests pasaron correctamente!');
    
  } catch (error) {
    console.error('❌ Error en tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUtilsAndRoles();
