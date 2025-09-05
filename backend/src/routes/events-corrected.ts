import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Configuración de Multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /events - Obtener todos los eventos
router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        eventPlaylists: {
          include: {
            playlist: {
              include: {
                items: {
                  include: { song: true },
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        eventSongs: {
          include: { song: true },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            attendees: true,
            joinRequests: { where: { status: 'PENDING' } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /events/:id - Obtener un evento específico
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        eventPlaylists: {
          include: {
            playlist: {
              include: {
                items: {
                  include: { song: true },
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        eventSongs: {
          include: { song: true },
          orderBy: { order: 'asc' }
        },
        attendees: {
          include: {
            user: {
              select: { 
                firstName: true, 
                lastName: true, 
                locationId: true,
                assignedRoles: { select: { role: true } }
              }
            }
          }
        },
        joinRequests: {
          include: {
            user: {
              select: { 
                firstName: true, 
                lastName: true, 
                email: true,
                assignedRoles: { select: { role: true } }
              }
            }
          },
          where: { status: 'PENDING' }
        },
        _count: {
          select: {
            attendees: true,
            joinRequests: { where: { status: 'PENDING' } }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /events/public - Obtener eventos públicos
router.get('/events/public', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { 
        isPublic: true,
        isActive: true,
        date: { gte: new Date() }
      },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        eventPlaylists: {
          include: {
            playlist: {
              include: {
                items: {
                  include: { song: true },
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        eventSongs: {
          include: { song: true },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            attendees: true,
            joinRequests: { where: { status: 'PENDING' } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos públicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /events - Crear un nuevo evento (solo ADMIN y DIRECTOR)
router.post('/events', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      time,
      locationId, 
      eventCity,
      eventAddress,
      country = 'Chile',
      mapLink,
      isPublic = true,
      allowExternalJoin = false,
      attendeeUserIds,
      songIds
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Título y fecha son obligatorios' });
    }

    // Verificar que el usuario sea ADMIN o DIRECTOR
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || !user.assignedRoles.some(r => r.role === 'ADMIN' || r.role === 'DIRECTOR')) {
      return res.status(403).json({ error: 'No tienes permisos para crear eventos' });
    }

    // Parsear arrays si vienen como strings
    let parsedAttendeeUserIds: string[] = [];
    let parsedSongIds: string[] = [];

    if (attendeeUserIds) {
      try {
        parsedAttendeeUserIds = typeof attendeeUserIds === 'string' 
          ? JSON.parse(attendeeUserIds) 
          : attendeeUserIds;
      } catch (error) {
        return res.status(400).json({ error: 'Formato inválido para attendeeUserIds' });
      }
    }

    if (songIds) {
      try {
        parsedSongIds = typeof songIds === 'string' 
          ? JSON.parse(songIds) 
          : songIds;
      } catch (error) {
        return res.status(400).json({ error: 'Formato inválido para songIds' });
      }
    }

    const eventData: any = {
      title,
      description,
      date: new Date(date),
      time,
      locationId: locationId || null,
      eventCity,
      eventAddress,
      country,
      mapLink,
      isPublic: Boolean(isPublic),
      allowExternalJoin: Boolean(allowExternalJoin),
      createdBy: req.user!.id
    };

    if (req.file) {
      eventData.imageUrl = `/uploads/events/${req.file.filename}`;
    }

    // Crear el evento y las relaciones en una transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Crear el evento
      const event = await prisma.event.create({
        data: eventData
      });

      // Agregar asistentes si se especificaron
      if (parsedAttendeeUserIds.length > 0) {
        const attendeeData = parsedAttendeeUserIds.map(userId => ({
          eventId: event.id,
          userId: userId,
          addedBy: req.user!.id
        }));

        await prisma.eventAttendee.createMany({
          data: attendeeData,
          skipDuplicates: true
        });
      }

      // Agregar canciones si se especificaron
      if (parsedSongIds.length > 0) {
        const songData = parsedSongIds.map((songId, index) => ({
          eventId: event.id,
          songId: songId,
          order: index + 1
        }));

        await prisma.eventSong.createMany({
          data: songData,
          skipDuplicates: true
        });
      }

      // Retornar el evento completo con relaciones
      return await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          location: true,
          creator: {
            select: { firstName: true, lastName: true }
          },
          eventPlaylists: {
            include: {
              playlist: {
                include: {
                  items: {
                    include: { song: true },
                    orderBy: { order: 'asc' }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          eventSongs: {
            include: { song: true },
            orderBy: { order: 'asc' }
          },
          attendees: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /events/:id - Actualizar un evento
router.put('/events/:id', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      date, 
      time,
      locationId, 
      eventCity,
      eventAddress,
      country,
      mapLink,
      isPublic,
      allowExternalJoin,
      isActive
    } = req.body;

    // Verificar que el evento existe y el usuario tiene permisos
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN') && existingEvent.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para editar este evento' });
    }

    const updateData: any = {
      title,
      description,
      date: date ? new Date(date) : undefined,
      time,
      locationId: locationId || null,
      eventCity,
      eventAddress,
      country,
      mapLink,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
      allowExternalJoin: allowExternalJoin !== undefined ? Boolean(allowExternalJoin) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined
    };

    // Filtrar valores undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (req.file) {
      updateData.imageUrl = `/uploads/events/${req.file.filename}`;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        eventPlaylists: {
          include: {
            playlist: {
              include: {
                items: {
                  include: { song: true },
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        eventSongs: {
          include: { song: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json(event);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /events/:id - Eliminar un evento
router.delete('/events/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar que el evento existe y el usuario tiene permisos
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN') && existingEvent.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este evento' });
    }

    await prisma.event.delete({
      where: { id }
    });

    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /events/locations/singers - Obtener cantantes por ubicación para selección masiva
router.get('/events/locations/singers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        users: {
          where: {
            assignedRoles: { some: { role: { in: ['CANTANTE', 'DIRECTOR'] } } },
            isActive: true
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedRoles: { select: { role: true } }
          }
        }
      }
    });

    res.json(locations);
  } catch (error) {
    console.error('Error al obtener cantantes por ubicación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /events/:id/attendees - Obtener asistentes de un evento
router.get('/events/:id/attendees', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedRoles: { select: { role: true } },
            locationId: true,
            location: true
          }
        }
      }
    });

    res.json(attendees);
  } catch (error) {
    console.error('Error al obtener asistentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /events/:id/attendees - Agregar asistentes a un evento
router.post('/events/:id/attendees', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de IDs de usuarios' });
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN') && event.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
    }

    // Agregar asistentes (ignorar duplicados)
    const attendeeData = userIds.map(userId => ({
      eventId: id,
      userId: userId,
      addedBy: req.user!.id
    }));

    await prisma.eventAttendee.createMany({
      data: attendeeData,
      skipDuplicates: true
    });

    // Obtener asistentes actualizados
    const updatedAttendees = await prisma.eventAttendee.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedRoles: { select: { role: true } },
            locationId: true,
            location: true
          }
        }
      }
    });

    res.json(updatedAttendees);
  } catch (error) {
    console.error('Error al agregar asistentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /events/:id/attendees/:userId - Remover asistente de un evento
router.delete('/events/:id/attendees/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, userId } = req.params;

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN') && event.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
    }

    await prisma.eventAttendee.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId: userId
        }
      }
    });

    res.json({ message: 'Asistente removido exitosamente' });
  } catch (error) {
    console.error('Error al remover asistente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /events/:id/songs - Agregar canciones a un evento
router.post('/events/:id/songs', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { songIds } = req.body;

    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de IDs de canciones' });
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN' || r.role === 'DIRECTOR') && event.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar canciones del evento' });
    }

    // Obtener el último orden para las nuevas canciones
    const lastEventSong = await prisma.eventSong.findFirst({
      where: { eventId: id },
      orderBy: { order: 'desc' }
    });

    const startOrder = lastEventSong ? lastEventSong.order + 1 : 1;

    // Agregar canciones con orden secuencial
    const eventSongData = songIds.map((songId: string, index: number) => ({
      eventId: id,
      songId: songId,
      order: startOrder + index
    }));

    await prisma.eventSong.createMany({
      data: eventSongData,
      skipDuplicates: true
    });

    // Obtener canciones actualizadas del evento
    const updatedEventSongs = await prisma.eventSong.findMany({
      where: { eventId: id },
      include: { song: true },
      orderBy: { order: 'asc' }
    });

    res.json({
      message: 'Canciones agregadas exitosamente',
      eventSongs: updatedEventSongs
    });
  } catch (error) {
    console.error('Error al agregar canciones al evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /events/:id/songs/:songId - Remover canción de un evento
router.delete('/events/:id/songs/:songId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, songId } = req.params;

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN' || r.role === 'DIRECTOR') && event.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar canciones del evento' });
    }

    await prisma.eventSong.deleteMany({
      where: {
        eventId: id,
        songId: songId
      }
    });

    res.json({ message: 'Canción removida del evento exitosamente' });
  } catch (error) {
    console.error('Error al remover canción del evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /events/:id/songs/reorder - Reordenar canciones de un evento
router.put('/events/:id/songs/reorder', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { songOrders } = req.body; // Array de { songId, order }

    if (!Array.isArray(songOrders)) {
      return res.status(400).json({ error: 'Se requiere un array de ordenamiento de canciones' });
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { assignedRoles: { select: { role: true } } }
    });

    if (!user || (!user.assignedRoles.some(r => r.role === 'ADMIN' || r.role === 'DIRECTOR') && event.createdBy !== req.user!.id)) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar canciones del evento' });
    }

    // Actualizar el orden de las canciones en una transacción
    await prisma.$transaction(
      songOrders.map((item: { songId: string; order: number }) =>
        prisma.eventSong.updateMany({
          where: {
            eventId: id,
            songId: item.songId
          },
          data: { order: item.order }
        })
      )
    );

    // Obtener canciones reordenadas
    const reorderedEventSongs = await prisma.eventSong.findMany({
      where: { eventId: id },
      include: { song: true },
      orderBy: { order: 'asc' }
    });

    res.json({
      message: 'Canciones reordenadas exitosamente',
      eventSongs: reorderedEventSongs
    });
  } catch (error) {
    console.error('Error al reordenar canciones del evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Funcionalidad para inicialización automática de la base de datos
const initializeDatabase = async () => {
  try {
    // Verificar si existen tablas
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('Base de datos vacía. Creando usuario administrador...');
      
      // Crear usuario administrador por defecto
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          firstName: 'Administrador',
          lastName: 'Sistema',
          email: 'admin@cgplayer.com',
          username: 'admin',
          password: hashedPassword,
          isActive: true
        }
      });

      // Crear rol de administrador
      await prisma.userRole_DB.create({
        data: {
          userId: admin.id,
          role: 'ADMIN',
          assignedBy: admin.id
        }
      });
      
      console.log('Usuario administrador creado exitosamente');
      console.log('Email: admin@cgplayer.com');
      console.log('Username: admin');
      console.log('Contraseña: admin123');
    }
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
  }
};

// Inicializar base de datos al cargar el módulo
initializeDatabase();

export default router;
