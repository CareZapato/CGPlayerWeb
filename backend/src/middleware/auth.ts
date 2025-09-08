import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    locationId?: string;
    voiceProfiles?: any[];
  };
  songFolderPath?: string;
  songFolderName?: string;
  file?: Express.Multer.File;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  
  
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Para archivos de audio y letras, también permitir token vía query parameter
  if (!token && (req.url.includes('/file/') || req.url.includes('/files/'))) {
    token = req.query.token as string;
  }

  if (!token) {
    console.log(`❌ [AUTH] No token provided`);
    return res.status(401).json({ message: 'Access token required' });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verificar que el usuario aún existe y obtener datos completos
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { 
          roles: {
            select: {
              role: true
            }
          },
          voiceProfiles: {
            select: {
              voiceType: true,
              createdAt: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        console.log(`❌ [AUTH] User not found or inactive: ${decoded.userId}`);
        console.log(`   ❌ Error Status: 401`);
        return res.status(401).json({ message: 'User not found or inactive' });
      }
      
      req.user = {
        id: user.id,
        email: user.email,
        roles: user.roles.map((r: any) => r.role),
        locationId: user.locationId || undefined,
        voiceProfiles: user.voiceProfiles || []
      };

      next();
      
    } catch (dbError: any) {
      // Manejar errores de base de datos (tablas no existen, etc.)
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.log(`⚠️ [AUTH] Database not ready (tables not exist), rejecting auth`);
        return res.status(503).json({ message: 'Database not ready' });
      }
      
      console.log(`❌ [AUTH] Database error during auth:`, dbError.message);
      return res.status(500).json({ message: 'Database error' });
    }
    
  } catch (error) {
    console.log(`❌ [AUTH] Token verification failed:`, error);
    console.log(`   ❌ Error Status: 403`);
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

// Middleware específico para requerer privilegios de administrador
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.roles.includes('ADMIN')) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }

  next();
};
