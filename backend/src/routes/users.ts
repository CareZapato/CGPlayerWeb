import express, { Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios con filtros y paginación
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número de página
 *         required: false
 *         schema:
 *           type: string
 *           default: '1'
 *       - name: limit
 *         in: query
 *         description: Límite de resultados por página
 *         required: false
 *         schema:
 *           type: string
 *           default: '10'
 *       - name: search
 *         in: query
 *         description: Buscar por nombre o apellido
 *         required: false
 *         schema:
 *           type: string
 *       - name: location
 *         in: query
 *         description: Filtrar por ubicación
 *         required: false
 *         schema:
 *           type: string
 *       - name: voiceType
 *         in: query
 *         description: Filtrar por tipo de voz
 *         required: false
 *         schema:
 *           type: string
 *           enum: [SOPRANO, MEZZOSOPRANO, ALTO, TENOR, BARITONO, BAJO]
 *       - name: role
 *         in: query
 *         description: Filtrar por rol
 *         required: false
 *         schema:
 *           type: string
 *       - name: isActive
 *         in: query
 *         description: Filtrar por estado activo
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permisos insuficientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Obtener todos los usuarios con paginación y filtros (solo directores y admins)
router.get('/', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      location = '',
      voiceType = '',
      role = '',
      isActive = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros dinámicos
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.location = {
        city: { equals: location as string, mode: 'insensitive' }
      };
    }

    if (voiceType) {
      where.voiceProfiles = {
        some: {
          voiceType: voiceType as string
        }
      };
    }

    if (role) {
      where.roles = {
        some: {
          role: role as string
        }
      };
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Obtener usuarios con paginación
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          location: {
            select: {
              id: true,
              name: true,
              city: true
              // color: true // Temporalmente comentado hasta que TypeScript reconozca el campo
            }
          },
          voiceProfiles: {
            select: {
              id: true,
              voiceType: true,
              createdAt: true,
              assignedByUser: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          roles: {
            select: {
              id: true,
              role: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
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

// Obtener un usuario específico por ID (solo directores y admins)
router.get('/:userId', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        location: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        voiceProfiles: {
          select: {
            id: true,
            voiceType: true,
            createdAt: true,
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        roles: {
          select: {
            id: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Actualizar datos de usuario (solo directores y admins)
router.put('/:userId', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, username, locationId, isActive } = req.body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        username,
        locationId: locationId || null,
        isActive
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        location: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    res.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Email or username already exists' });
    } else {
      res.status(500).json({ message: 'Failed to update user' });
    }
  }
});

// Actualizar voces de usuario (solo directores y admins)
router.put('/:userId/voices', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { voiceTypes } = req.body; // Array de tipos de voz

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Eliminar todas las voces actuales
    await prisma.userVoiceProfile.deleteMany({
      where: { userId }
    });

    // Agregar las nuevas voces
    const voiceProfiles = voiceTypes.map((voiceType: string) => ({
      userId,
      voiceType,
      assignedBy: req.user!.id
    }));

    await prisma.userVoiceProfile.createMany({
      data: voiceProfiles
    });

    // Obtener las voces actualizadas
    const updatedVoices = await prisma.userVoiceProfile.findMany({
      where: { userId },
      select: {
        id: true,
        voiceType: true,
        createdAt: true,
        assignedByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      voiceProfiles: updatedVoices,
      message: 'Voice profiles updated successfully'
    });
  } catch (error) {
    console.error('Error updating user voices:', error);
    res.status(500).json({ message: 'Failed to update user voices' });
  }
});

// Eliminar usuario (solo admins)
router.delete('/:userId', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // No permitir eliminar el propio usuario
    if (userId === req.user!.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Eliminar usuario (las relaciones se eliminan en cascada)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Obtener ubicaciones para filtros
router.get('/data/locations', authenticateToken, requireRole(['DIRECTOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // Obtener ciudades únicas de las ubicaciones
    const uniqueCities = await prisma.location.findMany({
      select: {
        city: true
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc'
      }
    });

    // Mapear las ciudades a un formato más útil
    const locations = uniqueCities.map(location => ({
      id: location.city.toLowerCase().replace(/\s+/g, '-'),
      name: location.city,
      city: location.city
    }));

    res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

export default router;
