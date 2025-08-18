import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Obtener todos los eventos
 *     tags: [Events]
 *     parameters:
 *       - name: locationId
 *         in: query
 *         description: Filtrar por ID de ubicación
 *         required: false
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         description: Filtrar por categoría
 *         required: false
 *         schema:
 *           type: string
 *       - name: upcoming
 *         in: query
 *         description: Solo eventos futuros
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Lista de eventos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Event'
 *                   - type: object
 *                     properties:
 *                       location:
 *                         $ref: '#/components/schemas/Location'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Obtener todos los eventos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { locationId, category, upcoming } = req.query;
    
    const where: any = { isActive: true };
    
    if (locationId) {
      where.locationId = locationId;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (upcoming === 'true') {
      where.date = { gte: new Date() };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        location: true,
        eventSongs: {
          include: {
            song: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        soloists: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                voiceProfiles: {
                  select: {
                    voiceType: true
                  }
                }
              }
            },
            song: {
              select: {
                id: true,
                title: true,
                artist: true
              }
            }
          }
        },
        _count: {
          select: {
            eventSongs: true,
            soloists: true
          }
        }
      },
      orderBy: { date: upcoming === 'true' ? 'asc' : 'desc' }
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Crear nuevo evento (solo ADMIN)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar roles del usuario
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { title, description, date, locationId, category } = req.body;

    if (!title || !date) {
      return res.status(400).json({ 
        message: 'Title and date are required' 
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        locationId,
        category
      },
      include: {
        location: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Obtener evento por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        eventSongs: {
          include: {
            song: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                childVersions: {
                  include: {
                    uploader: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        soloists: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                voiceProfiles: {
                  select: {
                    voiceType: true
                  }
                }
              }
            },
            song: {
              select: {
                id: true,
                title: true,
                artist: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// Actualizar evento (solo ADMIN)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { title, description, date, locationId, category } = req.body;

    if (!title || !date) {
      return res.status(400).json({ 
        message: 'Title and date are required' 
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        locationId,
        category
      },
      include: {
        location: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Actualizar evento (solo ADMIN)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { title, description, date, locationId, category, isActive } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(locationId !== undefined && { locationId }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        location: true
      }
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Agregar canciones al evento (solo ADMIN)
router.post('/:id/songs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { songs } = req.body; // Array de { songId, order, notes }

    if (!Array.isArray(songs)) {
      return res.status(400).json({ message: 'Songs must be an array' });
    }

    // Eliminar canciones existentes del evento
    await prisma.eventSong.deleteMany({
      where: { eventId: id }
    });

    // Agregar nuevas canciones
    const eventSongs = await prisma.eventSong.createMany({
      data: songs.map((song: any) => ({
        eventId: id,
        songId: song.songId,
        order: song.order,
        notes: song.notes
      }))
    });

    res.json({
      success: true,
      message: 'Event songs updated successfully',
      data: { created: eventSongs.count }
    });
  } catch (error) {
    console.error('Error updating event songs:', error);
    res.status(500).json({ message: 'Failed to update event songs' });
  }
});

// Agregar/actualizar solistas del evento (solo ADMIN)
router.post('/:id/soloists', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { soloists } = req.body; // Array de { userId, songId?, soloistType, notes? }

    if (!Array.isArray(soloists)) {
      return res.status(400).json({ message: 'Soloists must be an array' });
    }

    // Eliminar solistas existentes del evento
    await prisma.soloist.deleteMany({
      where: { eventId: id }
    });

    // Agregar nuevos solistas
    const eventSoloists = await prisma.soloist.createMany({
      data: soloists.map((soloist: any) => ({
        eventId: id,
        userId: soloist.userId,
        songId: soloist.songId || null,
        soloistType: soloist.soloistType,
        notes: soloist.notes
      }))
    });

    res.json({
      success: true,
      message: 'Event soloists updated successfully',
      data: { created: eventSoloists.count }
    });
  } catch (error) {
    console.error('Error updating event soloists:', error);
    res.status(500).json({ message: 'Failed to update event soloists' });
  }
});

// Eliminar evento (solo ADMIN)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hasAdminRole = req.user!.roles.some((role: string) => role === 'ADMIN');
    if (!hasAdminRole) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    // Soft delete para preservar historial
    await prisma.event.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Obtener estadísticas de eventos
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalEvents, upcomingEvents, thisMonthEvents, categories] = await Promise.all([
      prisma.event.count({ where: { isActive: true } }),
      prisma.event.count({ 
        where: { 
          isActive: true, 
          date: { gte: now } 
        } 
      }),
      prisma.event.count({
        where: {
          isActive: true,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.event.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true
      })
    ]);

    const categoryStats = categories.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category || 'Sin categoría'] = item._count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        thisMonthEvents,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ message: 'Failed to fetch event stats' });
  }
});

export default router;
