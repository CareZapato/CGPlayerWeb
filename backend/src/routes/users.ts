import express, { Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Obtener todos los usuarios (solo directores y admins)
router.get('/', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        location: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        voiceProfiles: {
          include: {
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Endpoint específico para estadísticas del dashboard (solo ADMIN)
router.get('/stats', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // Obtener usuarios con información completa
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        location: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        voiceProfiles: {
          select: {
            voiceType: true
          }
        },
        roles: {
          select: {
            role: true
          }
        }
      },
      where: {
        isActive: true
      }
    });

    // Estadísticas de usuarios por ubicación
    const usersByLocation = users.reduce((acc: any, user: any) => {
      const location = user.location?.name || 'Sin ubicación';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    // Estadísticas de usuarios por tipo de voz
    const usersByVoiceType = users.reduce((acc: any, user: any) => {
      user.voiceProfiles?.forEach((profile: any) => {
        acc[profile.voiceType] = (acc[profile.voiceType] || 0) + 1;
      });
      return acc;
    }, {});

    // Conteo por roles
    const usersByRole = users.reduce((acc: any, user: any) => {
      user.roles?.forEach((userRole: any) => {
        acc[userRole.role] = (acc[userRole.role] || 0) + 1;
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        usersByLocation: Object.entries(usersByLocation).map(([location, count]) => ({
          location,
          count: count as number
        })),
        usersByVoiceType: Object.entries(usersByVoiceType).map(([voiceType, count]) => ({
          voiceType,
          count: count as number
        })),
        usersByRole: Object.entries(usersByRole).map(([role, count]) => ({
          role,
          count: count as number
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
});

// Asignar tipo de voz a usuario (solo directores y admins)
router.post('/:userId/voice-profiles', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { voiceType } = req.body;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Crear o actualizar perfil de voz
    const voiceProfile = await prisma.userVoiceProfile.upsert({
      where: {
        userId_voiceType: {
          userId,
          voiceType
        }
      },
      update: {
        assignedBy: req.user!.id
      },
      create: {
        userId,
        voiceType,
        assignedBy: req.user!.id
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      message: 'Voice profile assigned successfully',
      voiceProfile
    });

  } catch (error) {
    console.error('Error assigning voice profile:', error);
    res.status(500).json({ message: 'Failed to assign voice profile' });
  }
});

// Eliminar tipo de voz de usuario
router.delete('/:userId/voice-profiles/:voiceType', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, voiceType } = req.params;

    await prisma.userVoiceProfile.delete({
      where: {
        userId_voiceType: {
          userId,
          voiceType: voiceType as any
        }
      }
    });

    res.json({ message: 'Voice profile removed successfully' });

  } catch (error) {
    console.error('Error removing voice profile:', error);
    res.status(500).json({ message: 'Failed to remove voice profile' });
  }
});

// Obtener perfil del usuario actual
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        voiceProfiles: {
          include: {
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

export default router;
