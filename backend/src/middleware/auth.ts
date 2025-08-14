import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  songFolderPath?: string;
  songFolderName?: string;
  file?: Express.Multer.File;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`🔐 [AUTH] Checking authentication for ${req.method} ${req.url}`);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`❌ [AUTH] No token provided`);
    return res.status(401).json({ message: 'Access token required' });
  }

  console.log(`🔑 [AUTH] Token found, verifying...`);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log(`✅ [AUTH] Token verified for user ID: ${decoded.userId}`);
    
    // Verificar que el usuario aún existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      console.log(`❌ [AUTH] User not found or inactive: ${decoded.userId}`);
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Obtener roles del usuario usando SQL raw
    const userRoleRows = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${decoded.userId}
    `;
    const userRoles = (userRoleRows as any[]).map(r => r.role);
    
    console.log(`👤 [AUTH] User authenticated: ${user.email} (${userRoles.join(', ')})`);

    req.user = {
      id: user.id,
      email: user.email,
      roles: userRoles
    };

    next();
  } catch (error) {
    console.log(`❌ [AUTH] Token verification failed:`, error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRequiredRole = roles.some(role => req.user!.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
