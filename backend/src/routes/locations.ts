import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Obtener todas las ubicaciones
router.get('/', async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
            events: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// Crear nueva ubicación (solo ADMIN)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { name, type, address, city, region, country } = req.body;

    if (!name || !type || !city) {
      return res.status(400).json({ 
        message: 'Name, type, and city are required' 
      });
    }

    const location = await prisma.location.create({
      data: {
        name,
        type,
        address,
        city,
        region,
        country: country || 'Chile'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Failed to create location' });
  }
});

// Actualizar ubicación (solo ADMIN)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { name, type, address, city, region, country, isActive } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(address !== undefined && { address }),
        ...(city && { city }),
        ...(region !== undefined && { region }),
        ...(country && { country }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Eliminar ubicación (solo ADMIN)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasAdminRole = req.user!.roles.some((role: string) => role === 'ADMIN');
    if (!hasAdminRole) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    // Verificar si hay usuarios o eventos asociados
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            events: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (location._count.users > 0 || location._count.events > 0) {
      // Soft delete si hay datos asociados
      await prisma.location.update({
        where: { id },
        data: { isActive: false }
      });
    } else {
      // Hard delete si no hay datos asociados
      await prisma.location.delete({
        where: { id }
      });
    }

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Failed to delete location' });
  }
});

// Obtener estadísticas de una ubicación
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Obtener usuarios de esta ubicación usando SQL raw
    const usersInLocation = await prisma.$queryRaw`
      SELECT u.id, u."firstName", u."lastName" 
      FROM users u 
      WHERE u."locationId" = ${id} AND u."isActive" = true
    `;

    // Obtener roles de estos usuarios
    const userRoles = await prisma.$queryRaw`
      SELECT ur.role, COUNT(*) as count
      FROM user_roles ur
      JOIN users u ON u.id = ur."userId"
      WHERE u."locationId" = ${id} AND u."isActive" = true
      GROUP BY ur.role
    `;

    // Obtener perfiles de voz
    const voiceProfiles = await prisma.$queryRaw`
      SELECT uvp."voiceType", COUNT(*) as count
      FROM user_voice_profiles uvp
      JOIN users u ON u.id = uvp."userId"
      WHERE u."locationId" = ${id} AND u."isActive" = true
      GROUP BY uvp."voiceType"
    `;

    // Obtener eventos recientes
    const recentEvents = await prisma.event.findMany({
      where: { 
        locationId: id,
        isActive: true 
      },
      include: {
        _count: {
          select: {
            eventSongs: true,
            soloists: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    const stats = {
      totalUsers: (usersInLocation as any[]).length,
      usersByRole: (userRoles as any[]).reduce((acc: Record<string, number>, item: any) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      usersByVoice: (voiceProfiles as any[]).reduce((acc: Record<string, number>, item: any) => {
        acc[item.voiceType] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      totalEvents: recentEvents.length,
      recentEvents: recentEvents
    };

    res.json({
      success: true,
      data: {
        location,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({ message: 'Failed to fetch location stats' });
  }
});

export default router;
