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
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
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

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        username,
        phone: phone || null,
        locationId: validLocationId,
        isActive
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
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

// Crear usuario manualmente (solo admins)
router.post('/create', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
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
      voiceTypes, 
      primaryVoice,  // Agregar primaryVoice del frontend
      role 
    } = req.body;

    console.log('Creating user with data:', {
      firstName,
      lastName,
      email,
      username,
      phone,
      locationId: locationId || 'NULL',
      isActive,
      voiceTypes,
      primaryVoice,
      role
    });

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !username || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verificar que el usuario no exista
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
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
      validLocationId = locationId;
      console.log('Valid location ID set:', validLocationId);
    } else {
      console.log('No location ID provided, setting to null');
    }

    // Hash de la contraseña
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        phone: phone || null,
        password: hashedPassword,
        locationId: validLocationId,
        isActive: isActive !== undefined ? isActive : true
      }
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

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username
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

export default router;
