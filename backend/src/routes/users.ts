import express, { Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import os from 'os';

const router = express.Router();

// Función para generar un username único basado en email
const generateUniqueUsername = async (email: string, excludeUserId?: string): Promise<string> => {
  const baseUsername = email.split('@')[0].toLowerCase();
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    // Si no existe o es el mismo usuario que estamos editando, está disponible
    if (!existingUser || (excludeUserId && existingUser.id === excludeUserId)) {
      break;
    }

    // Si existe, probar con el siguiente número
    username = `${baseUsername}.${counter}`;
    counter++;
  }

  return username;
};

// Función para validar si un username está disponible
const isUsernameAvailable = async (username: string, excludeUserId?: string): Promise<boolean> => {
  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  return !existingUser || (excludeUserId !== undefined && existingUser.id === excludeUserId);
};

// Función para obtener la IP del servidor de forma consistente
const getServerIP = (): string => {
  // Usar IP desde variables de entorno si está disponible (ip-config.env)
  if (process.env.SERVER_IP) {
    return process.env.SERVER_IP;
  }
  
  // Fallback a variables de entorno del sistema
  if (process.env.IP_ADDRESS) {
    return process.env.IP_ADDRESS;
  }
  
  if (process.env.API_HOST) {
    return process.env.API_HOST;
  }

  // Fallback a detección automática
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Último fallback
  return 'localhost';
};

// Función helper para generar URL de imagen de perfil
const generateProfileImageUrl = (profileImage: string | null): string | null => {
  if (!profileImage) return null;
  
  // Usar protocolo desde variable de entorno, fallback a detección automática
  const protocol = process.env.IMAGE_URL_PROTOCOL || (process.env.NODE_ENV === 'production' ? 'http' : 'http');
  const host = getServerIP();
  const port = process.env.PORT || '3001';
  return `${protocol}://${host}:${port}/api/uploads/images/profiles/${profileImage}`;
};

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
      status = '' // Filtro de estado (pending, active, inactive, PENDING, CONFIRMED, REFUSED)
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
      const locationStr = location as string;
      // Si location es un ID (para filtros de admin), usar locationId
      // Si location es texto (para búsqueda por ciudad), usar location.city
      if (locationStr.length > 10 && locationStr.includes('c')) {
        // Parece un ID de Prisma (cuid), filtrar por locationId
        where.locationId = locationStr;
        console.log('🔍 Admin filter by locationId:', locationStr);
      } else {
        // Es texto, filtrar por ciudad
        where.location = {
          city: { equals: locationStr, mode: 'insensitive' }
        };
        console.log('🔍 Admin filter by city:', locationStr);
      }
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

    if (status) {
      // Manejar el filtro de estado visual del frontend
      if (status === 'pending') {
        where.status = 'PENDING';
      } else if (status === 'refused') {
        where.status = 'REFUSED';
      } else if (status === 'active') {
        where.AND = [
          { status: { not: 'PENDING' } },
          { status: { not: 'REFUSED' } },
          { isActive: true }
        ];
      } else if (status === 'inactive') {
        where.AND = [
          { status: { not: 'PENDING' } },
          { status: { not: 'REFUSED' } },
          { isActive: false }
        ];
      } else {
        // Para valores directos como PENDING, CONFIRMED, REFUSED
        where.status = status as string;
      }
    }

    // Si el usuario actual es Director, filtrar solo por su ubicación
    const currentUserRoles = req.user?.roles || [];
    const isDirectorUser = currentUserRoles.includes('DIRECTOR');
    const isAdminUser = currentUserRoles.includes('ADMIN');
    
    // Para Directors que no son Admin, sobrescribir cualquier filtro de location
    if (isDirectorUser && !isAdminUser && req.user?.locationId) {
      // Limpiar cualquier filtro de location previo
      delete where.location;
      where.locationId = req.user.locationId;
      console.log('🎯 Director filter: locationId =', req.user.locationId);
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
          phone: true,
          isActive: true,
          status: true, // Test: should work after TypeScript restart
          createdAt: true,
          updatedAt: true,
          profileImage: true,
          location: {
            select: {
              id: true,
              name: true,
              city: true,
              color: true
            }
          },
          voiceProfiles: {
            select: {
              id: true,
              voiceType: true,
              isPrimary: true,
              createdAt: true,
              assignedByUser: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            } as any
          },
          roles: {
            select: {
              id: true,
              role: true,
              createdAt: true
            }
          }
        } as any,
        orderBy: {
          firstName: 'asc'
        },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    console.log('📊 Query results: Found', users.length, 'users of', totalCount, 'total');

    const totalPages = Math.ceil(totalCount / limitNum);

    // Transformar usuarios para agregar profileImageUrl y marca de pendiente
    const transformedUsers = users.map((user: any) => ({
      ...user,
      profileImageUrl: generateProfileImageUrl(user.profileImage),
      isPending: user.status === 'PENDING', // Agregar flag para el frontend
      needsApproval: user.status === 'PENDING' && user.isActive === false // Más específico
    }));

    res.json({
      success: true,
      data: {
        users: transformedUsers,
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
        profileImage: true,
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
          select: {
            id: true,
            voiceType: true,
            isPrimary: true,
            createdAt: true,
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          } as any,
          orderBy: [
            { isPrimary: 'desc' } as any,
            { voiceType: 'asc' }
          ]
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
        phone: true,
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
            isPrimary: true,
            createdAt: true,
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          } as any,
          orderBy: [
            { isPrimary: 'desc' } as any,
            { voiceType: 'asc' }
          ]
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
    const { firstName, lastName, email, username, phone, locationId, isActive } = req.body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: {
            role: true
          }
        }
      }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validaciones para cambio de estado activo
    const currentUserRoles = req.user?.roles || [];
    const isCurrentUserDirector = currentUserRoles.includes('DIRECTOR');
    const isCurrentUserAdmin = currentUserRoles.includes('ADMIN');

    // Validar username si se proporciona
    let finalUsername = username;
    if (username) {
      // Verificar si el username está disponible
      if (!await isUsernameAvailable(username, userId)) {
        return res.status(400).json({ 
          message: 'El nombre de usuario ya está en uso' 
        });
      }
    } else if (email && email !== existingUser.email) {
      // Si no se proporciona username pero cambia el email, generar uno nuevo
      finalUsername = await generateUniqueUsername(email, userId);
    }

    // Solo admins pueden editar ciertos campos como username, email, etc.
    if (!isCurrentUserAdmin) {
      // Directors solo pueden editar campos básicos, no username ni email
      if ((username && username !== existingUser.username) || 
          (email && email !== existingUser.email)) {
        return res.status(403).json({ 
          message: 'Solo los administradores pueden cambiar el username o email' 
        });
      }
    }

    // Si se está intentando cambiar el estado activo, validar permisos
    if (isActive !== existingUser.isActive) {
      // No permitir cambio de estado si el usuario está PENDING
      if ((existingUser as any).status === 'PENDING') {
        return res.status(403).json({ 
          message: 'No se puede cambiar el estado de un usuario pendiente de aprobación' 
        });
      }

      // Si el usuario actual es Director (y no Admin) y el usuario está REFUSED, no puede activarlo
      if (isCurrentUserDirector && !isCurrentUserAdmin && (existingUser as any).status === 'REFUSED' && isActive) {
        return res.status(403).json({ 
          message: 'Los directores no pueden reactivar usuarios rechazados' 
        });
      }
    }

    // Validar locationId si se proporciona
    let validLocationId = null;
    if (locationId && locationId !== 'null' && locationId.trim() !== '') {
      const locationExists = await prisma.location.findUnique({
        where: { id: locationId }
      });
      
      if (!locationExists) {
        console.log('Location ID not found for update:', locationId);
        return res.status(400).json({ message: 'Invalid location ID provided' });
      }
      validLocationId = locationId;
    }

    // Preparar los datos de actualización
    const updateData: any = {
      firstName,
      lastName,
      phone: phone || null,
      locationId: validLocationId,
      isActive
    };

    // Solo admins pueden cambiar email y username
    if (isCurrentUserAdmin) {
      if (email) updateData.email = email;
      if (finalUsername) updateData.username = finalUsername;
    }

    // Si un admin activa un usuario rechazado, cambiar status a CONFIRMED
    if (isCurrentUserAdmin && isActive && (existingUser as any).status === 'REFUSED') {
      updateData.status = 'CONFIRMED';
      console.log('🔄 Admin activating refused user - changing status to CONFIRMED');
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        status: true, // Now working after TypeScript restart
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
    const { voiceTypes, primaryVoice } = req.body; // Array de tipos de voz y voz primaria

    console.log('Updating voices for user:', userId, 'voices:', voiceTypes, 'primary:', primaryVoice);

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verificar que la voz primaria esté en la lista de voces
    if (primaryVoice && !voiceTypes.includes(primaryVoice)) {
      return res.status(400).json({ 
        message: 'Primary voice must be one of the selected voice types' 
      });
    }

    // Usar transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // Eliminar todas las voces actuales
      await tx.userVoiceProfile.deleteMany({
        where: { userId }
      });

      // Agregar las nuevas voces con indicador de primaria
      const voiceProfiles = voiceTypes.map((voiceType: string) => ({
        userId,
        voiceType,
        isPrimary: voiceType === primaryVoice, // Solo la voz primaria será true
        assignedBy: req.user!.id
      }));

      await tx.userVoiceProfile.createMany({
        data: voiceProfiles
      });
    });

    // Obtener las voces actualizadas
    const updatedVoices = await prisma.userVoiceProfile.findMany({
      where: { userId },
      select: {
        id: true,
        voiceType: true,
        isPrimary: true,
        createdAt: true,
        assignedByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      } as any,
      orderBy: [
        { isPrimary: 'desc' } as any, // Mostrar la voz primaria primero
        { voiceType: 'asc' }
      ]
    });

    console.log('Voices updated successfully:', updatedVoices);

    res.json({
      success: true,
      voiceProfiles: updatedVoices,
      message: 'Voice profiles updated successfully with primary voice'
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

// Endpoint para que un usuario cambie su propio username
router.put('/profile/username', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: 'Username es requerido' });
    }

    const trimmedUsername = username.trim();

    // Verificar si el username está disponible
    if (!await isUsernameAvailable(trimmedUsername, currentUserId)) {
      return res.status(400).json({ 
        message: 'El nombre de usuario ya está en uso' 
      });
    }

    // Actualizar el username del usuario actual
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: { username: trimmedUsername },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    res.json({
      message: 'Username actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear usuario manualmente (admins y directores)
router.post('/create', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req: AuthRequest, res: Response) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      username, 
      phone, 
      password, 
      locationId, 
      isActive, 
      status, // Nuevo campo de estado
      voiceTypes, 
      primaryVoice,  // Agregar primaryVoice del frontend
      role 
    } = req.body;

    // Determinar roles del usuario que está creando
    const creatorRoles = req.user?.roles || [];
    const isCreatedByAdmin = creatorRoles.includes('ADMIN');
    const isCreatedByDirector = creatorRoles.includes('DIRECTOR');

    console.log('Creating user with data:', {
      firstName,
      lastName,
      email,
      username,
      phone,
      locationId: locationId || 'NULL',
      isActive,
      status: status || 'CONFIRMED',
      voiceTypes,
      primaryVoice,
      role
    });

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generar username si no se proporciona
    let finalUsername = username;
    if (!username || username.trim().length === 0) {
      finalUsername = await generateUniqueUsername(email);
      console.log(`Generated username: ${finalUsername} from email: ${email}`);
    } else {
      // Verificar que el username proporcionado esté disponible
      if (!await isUsernameAvailable(username)) {
        return res.status(400).json({ 
          message: 'El nombre de usuario ya está en uso' 
        });
      }
      finalUsername = username.trim();
    }

    // Validar que Directors solo puedan crear usuarios con rol CANTANTE
    if (isCreatedByDirector && !isCreatedByAdmin && role !== 'CANTANTE') {
      return res.status(403).json({ 
        message: 'Los directores solo pueden crear usuarios con rol CANTANTE' 
      });
    }

    // Verificar que el usuario no exista
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: finalUsername }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Validar locationId si se proporciona
    let validLocationId = null;
    
    if (locationId && locationId !== 'null' && locationId.trim() !== '') {
      const locationExists = await prisma.location.findUnique({
        where: { id: locationId }
      });
      
      if (!locationExists) {
        console.log('Location ID not found:', locationId);
        return res.status(400).json({ message: 'Invalid location ID provided' });
      }
      
      // Si es Director (y no Admin), solo puede crear usuarios en su ubicación
      if (isCreatedByDirector && !isCreatedByAdmin) {
        if (locationId !== req.user?.locationId) {
          return res.status(403).json({ 
            message: 'Los directores solo pueden crear usuarios en su propia ubicación' 
          });
        }
      }
      
      validLocationId = locationId;
      console.log('Valid location ID set:', validLocationId);
    } else {
      console.log('No location ID provided, setting to null');
      
      // Si es Director, automáticamente asignar su ubicación
      if (isCreatedByDirector && !isCreatedByAdmin && req.user?.locationId) {
        validLocationId = req.user.locationId;
        console.log('Director creating user - auto-assigned location:', validLocationId);
      }
    }

    // Hash de la contraseña
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determinar el estado inicial y isActive según quién crea el usuario
    let finalStatus = status || 'CONFIRMED';
    let finalIsActive = isActive !== undefined ? isActive : true;
    
    // Si es creado por un Director (y no es Admin), el usuario necesita aprobación
    if (isCreatedByDirector && !isCreatedByAdmin) {
      finalStatus = 'PENDING';
      finalIsActive = false; // Usuario inactivo hasta que sea aprobado
      console.log('🔶 Usuario creado por Director - Estado: PENDING, Activo: false, Requiere aprobación de Admin');
    } else if (isCreatedByAdmin) {
      console.log('✅ Usuario creado por Admin - Estado: CONFIRMED, Activo inmediatamente');
    }

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username: finalUsername,
        phone: phone || null,
        password: hashedPassword,
        locationId: validLocationId,
        isActive: finalIsActive,
        status: finalStatus
      } as any
    });

    console.log('📝 Usuario creado exitosamente:', {
      id: newUser.id,
      nombre: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      status: finalStatus,
      isActive: finalIsActive,
      locationId: validLocationId,
      createdBy: req.user?.id,
      creatorRoles,
      needsApproval: isCreatedByDirector && !isCreatedByAdmin
    });

    // Asignar rol único
    await prisma.userRole_DB.create({
      data: {
        userId: newUser.id,
        role: role as any,
        assignedBy: req.user!.id
      }
    });

    // Asignar tipos de voz si se proporcionaron
    if (voiceTypes && Array.isArray(voiceTypes) && voiceTypes.length > 0) {
      // Crear perfiles de voz con sistema de voz primaria
      const voiceProfiles = voiceTypes.map((voiceType: string) => ({
        userId: newUser.id,
        voiceType: voiceType as any,
        isPrimary: voiceType === primaryVoice || (!primaryVoice && voiceType === voiceTypes[0]), // Usar primaryVoice del frontend
        assignedBy: req.user!.id
      }));

      await prisma.userVoiceProfile.createMany({
        data: voiceProfiles as any
      });
    }

    // Determinar mensaje apropiado según quien creó el usuario
    const successMessage = isCreatedByDirector && !isCreatedByAdmin 
      ? 'Usuario creado exitosamente. Pendiente de aprobación por un administrador.'
      : 'User created successfully';

    res.status(201).json({
      success: true,
      message: successMessage,
      needsApproval: isCreatedByDirector && !isCreatedByAdmin,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        status: finalStatus,
        isActive: finalIsActive
      }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Usuario con este email o nombre de usuario ya existe' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Error de referencia: verifique que la ubicación sea válida' });
    }
    
    res.status(500).json({ 
      message: 'Error al crear usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar rol único de usuario (solo admins)
router.put('/:userId/role', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Usar transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // Eliminar todos los roles actuales del usuario
      await tx.userRole_DB.deleteMany({
        where: { userId }
      });

      // Asignar el nuevo rol único
      await tx.userRole_DB.create({
        data: {
          userId,
          role: role as any,
          assignedBy: req.user!.id
        }
      });
    });

    res.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Importar usuarios desde CSV (solo admins)
router.post('/import-csv', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ message: 'Users array is required' });
    }

    const results = {
      created: 0,
      errors: [] as any[]
    };

    const bcrypt = require('bcryptjs');
    const defaultPassword = 'usuario123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Obtener todas las ubicaciones para mapeo
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        city: true
      }
    });

    for (const userData of users) {
      try {
        const { firstName, lastName, email, username, phone, locationName, voiceTypes } = userData;

        // Validar campos requeridos
        if (!firstName || !lastName || !email || !username) {
          results.errors.push({
            line: userData.lineNumber,
            error: 'Missing required fields (firstName, lastName, email, username)',
            data: userData
          });
          continue;
        }

        // Verificar usuario duplicado
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { username }
            ]
          }
        });

        if (existingUser) {
          results.errors.push({
            line: userData.lineNumber,
            error: 'User with this email or username already exists',
            data: userData
          });
          continue;
        }

        // Buscar ubicación por nombre de ciudad
        let locationId = null;
        if (locationName) {
          const location = locations.find(loc => 
            loc.city.toLowerCase() === locationName.toLowerCase() ||
            loc.name.toLowerCase().includes(locationName.toLowerCase())
          );
          locationId = location?.id || null;
        }

        // Crear usuario
        const newUser = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            username,
            phone: phone || null,
            password: hashedPassword,
            locationId,
            isActive: true
          }
        });

        // Asignar rol CANTANTE por defecto
        await prisma.userRole_DB.create({
          data: {
            userId: newUser.id,
            role: 'CANTANTE',
            assignedBy: req.user!.id
          }
        });

        // Asignar tipos de voz si se proporcionaron
        if (voiceTypes && Array.isArray(voiceTypes) && voiceTypes.length > 0) {
          const validVoiceTypes = voiceTypes.filter(voiceType => 
            ['SOPRANO', 'MESOSOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO'].includes(voiceType)
          );

          if (validVoiceTypes.length > 0) {
            const voiceProfiles = validVoiceTypes.map((voiceType: string, index: number) => ({
              userId: newUser.id,
              voiceType: voiceType as any,
              isPrimary: index === 0, // Primera voz es primaria
              assignedBy: req.user!.id
            }));

            await prisma.userVoiceProfile.createMany({
              data: voiceProfiles as any
            });
          }
        }

        results.created++;

      } catch (userError) {
        console.error('Error creating user:', userError);
        results.errors.push({
          line: userData.lineNumber,
          error: 'Failed to create user',
          data: userData
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${results.created} users created.`,
      ...results
    });

  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ message: 'Failed to import users' });
  }
});

// Aprobar usuario (admins y directores de la misma ubicación)
router.patch('/:userId/approve', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = (req as any).user.id;

    // Obtener información del usuario que hace la petición
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      include: { 
        assignedRoles: { select: { role: true } }
      }
    });

    const isAdmin = requestingUser?.assignedRoles?.some((role: any) => role.role === 'ADMIN');

    // Verificar que el usuario existe y está pendiente
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        status: true, 
        firstName: true, 
        lastName: true, 
        isActive: true, 
        locationId: true 
      }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (existingUser.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `El usuario ya tiene estado: ${existingUser.status}` 
      });
    }

    // Si es director (y no admin), verificar que el usuario pertenezca a su ubicación
    if (!isAdmin && requestingUser?.locationId !== existingUser.locationId) {
      return res.status(403).json({ 
        message: 'Solo puedes aprobar usuarios de tu propia ubicación' 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'CONFIRMED',
        isActive: true // Activar usuario al aprobar
      }
    });

    console.log('Usuario aprobado:', {
      userId,
      name: `${existingUser.firstName} ${existingUser.lastName}`,
      previousStatus: existingUser.status,
      newStatus: 'CONFIRMED',
      approvedBy: requestingUserId
    });

    res.json({
      success: true,
      message: 'Usuario aprobado y activado correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Error al aprobar usuario' });
  }
});

// Rechazar usuario (admins y directores de la misma ubicación)
router.patch('/:userId/reject', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = (req as any).user.id;

    // Obtener información del usuario que hace la petición
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      include: { 
        assignedRoles: { select: { role: true } }
      }
    });

    const isAdmin = requestingUser?.assignedRoles?.some((role: any) => role.role === 'ADMIN');

    // Verificar que el usuario existe y está pendiente
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        status: true, 
        firstName: true, 
        lastName: true, 
        isActive: true, 
        locationId: true 
      }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (existingUser.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `El usuario ya tiene estado: ${existingUser.status}` 
      });
    }

    // Si es director (y no admin), verificar que el usuario pertenezca a su ubicación
    if (!isAdmin && requestingUser?.locationId !== existingUser.locationId) {
      return res.status(403).json({ 
        message: 'Solo puedes rechazar usuarios de tu propia ubicación' 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'REFUSED',
        isActive: false // Mantener usuario inactivo al rechazar
      }
    });

    console.log('Usuario rechazado:', {
      userId,
      name: `${existingUser.firstName} ${existingUser.lastName}`,
      previousStatus: existingUser.status,
      newStatus: 'REFUSED',
      rejectedBy: requestingUserId
    });

    res.json({
      success: true,
      message: 'Usuario rechazado',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Error al rechazar usuario' });
  }
});

// Obtener usuarios pendientes de aprobación (solo admins)
router.get('/pending-approval', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Obtener información del usuario que hace la petición
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        assignedRoles: { select: { role: true } }
      }
    });

    const isAdmin = requestingUser?.assignedRoles?.some((role: any) => role.role === 'ADMIN');
    const isDirector = requestingUser?.assignedRoles?.some((role: any) => role.role === 'DIRECTOR');

    // Construir filtros según el rol
    let whereFilter: any = {
      status: 'PENDING'
    };

    // Si es director (y no admin), filtrar por su ubicación
    if (isDirector && !isAdmin && requestingUser?.locationId) {
      whereFilter.locationId = requestingUser.locationId;
    }

    const pendingUsers = await prisma.user.findMany({
      where: whereFilter,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        status: true, // Now working after TypeScript restart
        createdAt: true,
        updatedAt: true,
        profileImage: true,
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            color: true
          }
        },
        voiceProfiles: {
          select: {
            id: true,
            voiceType: true,
            isPrimary: true,
            createdAt: true,
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          } as any
        },
        roles: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true,
                roles: {
                  select: {
                    role: true
                  }
                }
              }
            }
          } as any
        }
      } as any,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar usuarios para agregar profileImageUrl
    const transformedUsers = pendingUsers.map((user: any) => ({
      ...user,
      profileImageUrl: generateProfileImageUrl(user.profileImage),
      needsApproval: true // Indicador para el frontend
    }));

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        count: transformedUsers.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Failed to fetch pending users' });
  }
});

// Obtener conteo de usuarios pendientes (para badge de notificación)
router.get('/pending-count', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Obtener información del usuario que hace la petición
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        assignedRoles: { select: { role: true } }
      }
    });

    const isAdmin = requestingUser?.assignedRoles?.some((role: any) => role.role === 'ADMIN');
    const isDirector = requestingUser?.assignedRoles?.some((role: any) => role.role === 'DIRECTOR');

    // Construir filtros según el rol
    let whereFilter: any = {
      status: 'PENDING'
    };

    // Si es director (y no admin), filtrar por su ubicación
    if (isDirector && !isAdmin && requestingUser?.locationId) {
      whereFilter.locationId = requestingUser.locationId;
    }

    const pendingCount = await prisma.user.count({
      where: whereFilter
    });

    console.log('📊 Usuarios pendientes de aprobación:', pendingCount);

    res.json({
      success: true,
      count: pendingCount,
      userContext: {
        isAdmin,
        isDirector,
        locationId: requestingUser?.locationId
      }
    });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Failed to fetch pending count' });
  }
});

export default router;
