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

// Crear nueva ubicación (solo ADMIN/DIRECTOR)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!['ADMIN', 'DIRECTOR'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Access denied' });
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

// Actualizar ubicación (solo ADMIN/DIRECTOR)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!['ADMIN', 'DIRECTOR'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Access denied' });
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
    if (req.user!.role !== 'ADMIN') {
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
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            voiceProfiles: {
              select: {
                voiceType: true
              }
            }
          }
        },
        events: {
          where: { isActive: true },
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
        }
      }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const stats = {
      totalUsers: location.users.length,
      usersByRole: location.users.reduce((acc: Record<string, number>, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      usersByVoice: location.users.reduce((acc: Record<string, number>, user: any) => {
        user.voiceProfiles.forEach((profile: any) => {
          acc[profile.voiceType] = (acc[profile.voiceType] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
      totalEvents: location.events.length,
      recentEvents: location.events
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
