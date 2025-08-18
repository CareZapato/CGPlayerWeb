import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    locationId?: string;
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
    
    // Verificar que el usuario aún existe y obtener datos completos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        isActive: true,
        locationId: true,
        roles: {
          select: {
            role: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      console.log(`❌ [AUTH] User not found or inactive: ${decoded.userId}`);
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    console.log(`👤 [AUTH] User authenticated: ${user.email} (${user.roles.map(r => r.role).join(', ')})`);

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => r.role),
      locationId: user.locationId || undefined
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
