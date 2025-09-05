import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads/events');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/events - Obtener todos los eventos (para gestión admin/director)
router.get('/', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        attendees: {
          include: {
            user: {
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                locationId: true,
                location: { select: { name: true } },
                assignedRoles: { select: { role: true } }
              }
            },
            addedByUser: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        joinRequests: {
          where: { status: 'PENDING' },
          include: {
            user: {
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                locationId: true,
                assignedRoles: { select: { role: true } }
              }
            }
          }
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

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos'
    });
  }
});

// GET /api/events/public - Obtener solo eventos públicos que permiten solicitudes externas
router.get('/public', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { 
        isPublic: true,
        allowExternalJoin: true,
        isActive: true,
        date: { gte: new Date() }
      },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
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

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos públicos'
    });
  }
});

// GET /api/events/my - Obtener eventos del usuario actual
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { attendees: { some: { userId } } }
        ],
        isActive: true
      },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        attendees: {
          include: {
            user: {
              select: { firstName: true, lastName: true, locationId: true }
            }
          }
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

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos del usuario'
    });
  }
});

// POST /api/events - Crear nuevo evento (admin/director)
router.post('/', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      category = 'Culto',
      locationId,
      eventCity,
      eventAddress,
      country = 'Chile',
      mapLink,
      isPublic = false,
      allowExternalJoin = false,
      attendeeUserIds,
      choirLocationIds
    } = req.body;

    const userId = (req as any).user.id;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: 'Título y fecha son requeridos'
      });
    }

    // Crear el evento
    const eventData: any = {
      title,
      description,
      date: new Date(date),
      time,
      category,
      eventCity,
      eventAddress,
      country,
      mapLink,
      isPublic: Boolean(isPublic),
      allowExternalJoin: Boolean(allowExternalJoin),
      createdBy: userId
    };

    if (locationId) {
      eventData.locationId = locationId;
    }

    if (req.file) {
      eventData.imageUrl = `/uploads/events/${req.file.filename}`;
    }

    const event = await prisma.event.create({
      data: eventData
    });

    // Agregar asistentes individuales
    if (attendeeUserIds) {
      const individualAttendees = Array.isArray(attendeeUserIds) 
        ? attendeeUserIds 
        : JSON.parse(attendeeUserIds || '[]');
        
      if (individualAttendees.length > 0) {
        await prisma.eventAttendee.createMany({
          data: individualAttendees.map((attendeeId: string) => ({
            eventId: event.id,
            userId: attendeeId,
            addedBy: userId,
            status: 'CONFIRMED'
          })),
          skipDuplicates: true
        });
      }
    }

    // Agregar todos los cantantes de ubicaciones específicas (coros completos)
    if (choirLocationIds) {
      const choirLocationIds_parsed = Array.isArray(choirLocationIds) 
        ? choirLocationIds 
        : JSON.parse(choirLocationIds || '[]');
        
      if (choirLocationIds_parsed.length > 0) {
        const choirMembers = await prisma.user.findMany({
          where: {
            locationId: { in: choirLocationIds_parsed },
            isActive: true,
            assignedRoles: {
              some: {
                role: { in: ['CANTANTE', 'DIRECTOR'] }
              }
            }
          },
          select: { id: true }
        });

        if (choirMembers.length > 0) {
          await prisma.eventAttendee.createMany({
            data: choirMembers.map(member => ({
              eventId: event.id,
              userId: member.id,
              addedBy: userId,
              status: 'CONFIRMED'
            })),
            skipDuplicates: true
          });
        }
      }
    }

    // Obtener el evento completo para la respuesta
    const completeEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        attendees: {
          include: {
            user: {
              select: { firstName: true, lastName: true, locationId: true }
            }
          }
        },
        _count: {
          select: { attendees: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: completeEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear evento'
    });
  }
});

// GET /api/events/locations/singers - Obtener cantantes por ubicación para selección masiva
router.get('/locations/singers', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: {
            isActive: true,
            assignedRoles: {
              some: {
                role: { in: ['CANTANTE', 'DIRECTOR'] }
              }
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            assignedRoles: {
              select: { role: true }
            }
          }
        },
        _count: {
          select: { 
            users: {
              where: {
                isActive: true,
                assignedRoles: {
                  some: {
                    role: { in: ['CANTANTE', 'DIRECTOR'] }
                  }
                }
              }
            }
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
    console.error('Error fetching singers by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cantantes por ubicación'
    });
  }
});

// GET /api/events/search/singers - Búsqueda en tiempo real de cantantes
router.get('/search/singers', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || (query as string).length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const singers = await prisma.user.findMany({
      where: {
        isActive: true,
        assignedRoles: {
          some: {
            role: { in: ['CANTANTE', 'DIRECTOR'] }
          }
        },
        OR: [
          { firstName: { contains: query as string, mode: 'insensitive' } },
          { lastName: { contains: query as string, mode: 'insensitive' } },
          { email: { contains: query as string, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        locationId: true,
        location: {
          select: { name: true }
        },
        assignedRoles: {
          select: { role: true }
        },
        voiceProfiles: {
          select: { voiceType: true }
        }
      },
      take: 20,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: singers
    });
  } catch (error) {
    console.error('Error searching singers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar cantantes'
    });
  }
});

// POST /api/events/:id/attendees - Agregar asistentes a un evento
router.post('/:id/attendees', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds = [], choirLocationIds = [] } = req.body;
    const userId = (req as any).user.id;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    const attendeesToAdd: string[] = [...userIds];

    // Agregar cantantes de ubicaciones completas
    if (choirLocationIds.length > 0) {
      const choirMembers = await prisma.user.findMany({
        where: {
          locationId: { in: choirLocationIds },
          isActive: true,
          assignedRoles: {
            some: {
              role: { in: ['CANTANTE', 'DIRECTOR'] }
            }
          }
        },
        select: { id: true }
      });

      attendeesToAdd.push(...choirMembers.map(member => member.id));
    }

    // Remover duplicados
    const uniqueAttendees = [...new Set(attendeesToAdd)];

    if (uniqueAttendees.length > 0) {
      await prisma.eventAttendee.createMany({
        data: uniqueAttendees.map(attendeeId => ({
          eventId: id,
          userId: attendeeId,
          addedBy: userId,
          status: 'CONFIRMED'
        })),
        skipDuplicates: true
      });
    }

    res.json({
      success: true,
      message: `${uniqueAttendees.length} asistente(s) agregado(s) exitosamente`
    });
  } catch (error) {
    console.error('Error adding attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar asistentes'
    });
  }
});

// DELETE /api/events/:id/attendees/:userId - Remover asistente específico
router.delete('/:id/attendees/:userId', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { id, userId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    await prisma.eventAttendee.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId: userId
        }
      }
    });

    res.json({
      success: true,
      message: 'Asistente removido exitosamente'
    });
  } catch (error) {
    console.error('Error removing attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover asistente'
    });
  }
});

// GET /api/events/:id - Obtener un evento específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        attendees: {
          include: {
            user: {
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                locationId: true,
                location: { select: { name: true } },
                assignedRoles: { select: { role: true } }
              }
            }
          }
        },
        joinRequests: {
          include: {
            user: {
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                email: true,
                locationId: true
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
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento'
    });
  }
});

// POST /api/events/:id/join-request - Solicitar unirse a un evento público
router.post('/:id/join-request', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = (req as any).user.id;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    if (!event.isPublic || !event.allowExternalJoin) {
      return res.status(403).json({
        success: false,
        message: 'Este evento no permite solicitudes externas'
      });
    }

    // Verificar si ya es asistente
    const existingAttendee = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    if (existingAttendee) {
      return res.status(400).json({
        success: false,
        message: 'Ya estás registrado en este evento'
      });
    }

    // Verificar si ya tiene solicitud pendiente
    const existingRequest = await prisma.eventJoinRequest.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una solicitud pendiente para este evento'
      });
    }

    const joinRequest = await prisma.eventJoinRequest.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      },
      update: {
        message,
        status: 'PENDING'
      },
      create: {
        eventId: id,
        userId,
        message,
        status: 'PENDING'
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, locationId: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada exitosamente',
      data: joinRequest
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar solicitud'
    });
  }
});

// PUT /api/events/:id/join-requests/:requestId - Responder a solicitud de unión
router.put('/:id/join-requests/:requestId', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { status, response } = req.body;
    const userId = (req as any).user.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const joinRequest = await prisma.eventJoinRequest.findUnique({
      where: { id: requestId },
      include: { event: true }
    });

    if (!joinRequest || joinRequest.eventId !== id) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const updatedRequest = await prisma.eventJoinRequest.update({
      where: { id: requestId },
      data: {
        status,
        response
      }
    });

    // Si se acepta la solicitud, agregar como asistente
    if (status === 'APPROVED') {
      await prisma.eventAttendee.create({
        data: {
          eventId: id,
          userId: joinRequest.userId,
          addedBy: userId,
          status: 'CONFIRMED'
        }
      });
    }

    res.json({
      success: true,
      message: `Solicitud ${status === 'APPROVED' ? 'aceptada' : 'rechazada'} exitosamente`,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error responding to join request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al responder solicitud'
    });
  }
});

export default router;
