import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔐 Simulando login del usuario ADMIN...\n');
    
    const login = 'admin@cgplayer.com';
    const password = 'admin123';

    // Buscar usuario
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { username: login }
        ],
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.firstName} ${user.lastName}`);

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`🔑 Contraseña válida: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return;
    }

    // Obtener roles del usuario usando query raw
    const userRoleRows = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${user.id}
    `;
    const userRoles = (userRoleRows as any[]).map(r => r.role);

    console.log(`🏷️  Roles encontrados: ${userRoles.join(', ')}`);

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: userRoles },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );

    console.log(`🎫 Token generado: ${token.substring(0, 50)}...`);

    // Respuesta sin contraseña  
    const { password: _, ...userWithoutPassword } = user;

    // Mapear roles al formato esperado por el frontend
    const formattedRoles = userRoles.map((role: string) => ({
      id: `${user.id}_${role}`, // ID temporal para el frontend
      userId: user.id,
      role: role,
      isActive: true,
      assignedAt: new Date().toISOString()
    }));

    console.log('\n📤 Respuesta formateada para el frontend:');
    console.log({
      message: 'Login successful',
      user: { ...userWithoutPassword, roles: formattedRoles },
      token: token.substring(0, 50) + '...'
    });

  } catch (error) {
    console.error('❌ Error durante la simulación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
