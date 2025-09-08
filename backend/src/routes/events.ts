import express from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { NewsService } from '../services/newsService';
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
        eventSongs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                voiceType: true,
                filePath: true,
                folderName: true,
                fileName: true
              }
            }
          },
          orderBy: { order: 'asc' }
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
            eventSongs: true,
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

// GET /api/events/management/all - Alias para obtener todos los eventos para gestión
router.get('/management/all', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
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
            joinRequests: { where: { status: 'PENDING' } },
            eventSongs: true
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
    console.error('Error fetching events for management:', error);
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

// GET /api/events/visible - Obtener eventos visibles según el rol del usuario
router.get('/visible', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const userRoles = user.assignedRoles?.map((ar: any) => ar.role) || [];
    const userId = user.id;
    
    let whereCondition: any = {
      isActive: true
    };

    // Si es ADMIN o DIRECTOR, puede ver todos los eventos
    if (userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR')) {
      // No agregar restricciones adicionales - puede ver todos
    } else {
      // Para otros roles, solo eventos públicos o donde sea asistente
      whereCondition = {
        ...whereCondition,
        OR: [
          { isPublic: true },
          { attendees: { some: { userId: userId } } }
        ]
      };
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
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
            joinRequests: { where: { status: 'PENDING' } },
            eventSongs: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Enriquecer cada evento con información específica del usuario
    const eventsWithUserInfo = events.map(event => {
      // Verificar si el usuario es asistente
      const userAttendee = event.attendees.find(attendee => attendee.userId === userId);
      const isUserAttendee = !!userAttendee;
      
      // Buscar solicitud del usuario para este evento
      const userJoinRequest = event.joinRequests.find(request => request.userId === userId);
      
      // Información de confirmación de asistencia
      const userAttendanceStatus = userAttendee ? {
        attendanceConfirmed: (userAttendee as any).attendanceConfirmed,
        nonAttendanceComment: (userAttendee as any).nonAttendanceComment,
        status: (userAttendee as any).status
      } : null;
      
      return {
        ...event,
        isUserAttendee,
        userJoinRequest: userJoinRequest ? {
          id: userJoinRequest.id,
          status: userJoinRequest.status,
          message: userJoinRequest.message,
          response: userJoinRequest.response,
          createdAt: userJoinRequest.createdAt,
          updatedAt: userJoinRequest.updatedAt
        } : null,
        userAttendanceStatus
      };
    });

    console.log(`📋 Found ${eventsWithUserInfo.length} visible events for user ${userId}`);

    res.json({
      success: true,
      data: eventsWithUserInfo
    });
  } catch (error) {
    console.error('Error fetching visible events:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos visibles'
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
      choirLocationIds,
      songIds
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
                role: { in: [UserRole.CANTANTE, UserRole.DIRECTOR] }
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

    // Agregar canciones al evento
    if (songIds) {
      console.log('🎵 Processing songIds:', songIds);
      const songIds_parsed = Array.isArray(songIds) 
        ? songIds 
        : JSON.parse(songIds || '[]');
      
      console.log('🎵 Parsed songIds:', songIds_parsed);
        
      if (songIds_parsed.length > 0) {
        const eventSongs = songIds_parsed.map((songId: string, index: number) => ({
          eventId: event.id,
          songId: songId,
          order: index + 1
        }));

        console.log('🎵 Creating EventSongs:', eventSongs);

        await prisma.eventSong.createMany({
          data: eventSongs,
          skipDuplicates: true
        });

        console.log('✅ EventSongs created successfully');
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
        eventSongs: {
          include: {
            song: {
              select: { 
                id: true, 
                title: true, 
                artist: true, 
                duration: true, 
                voiceType: true,
                filePath: true,
                folderName: true,
                fileName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { 
            attendees: true,
            eventSongs: true
          }
        }
      }
    });

    // Create news notification about new event
    try {
      await NewsService.createEventCreatedNews(
        title,
        date,
        event.id,
        category || 'Culto'
      );
    } catch (error) {
      console.error('❌ Error creating news for event:', error);
      // Don't fail the whole event creation if news creation fails
    }

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

// PUT /events/:id - Actualizar un evento existente
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    console.log('🔄 Updating event:', id);
    console.log('📝 Update data:', req.body);

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: true,
        eventSongs: true
      }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar permisos (solo el creador o admin puede editar)
    const userRoles = user.assignedRoles?.map((ar: any) => ar.role) || [];
    if (existingEvent.createdBy !== userId && !userRoles.includes('ADMIN') && !userRoles.includes('DIRECTOR')) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este evento'
      });
    }

    const {
      title,
      description,
      date,
      time,
      locationId,
      category,
      eventCity,
      eventAddress,
      country,
      mapLink,
      isPublic,
      allowExternalJoin,
      attendeeIds,
      songIds,
      autoAssignChoir
    } = req.body;

    // Procesar imagen si se subió una nueva
    let imageUrl = existingEvent.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/events/${req.file.filename}`;
    }

    // Actualizar datos básicos del evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: title || existingEvent.title,
        description: description || existingEvent.description,
        date: date ? new Date(date) : existingEvent.date,
        time: time || existingEvent.time,
        locationId: locationId || existingEvent.locationId,
        category: category || existingEvent.category,
        eventCity: eventCity || existingEvent.eventCity,
        eventAddress: eventAddress || existingEvent.eventAddress,
        country: country || existingEvent.country,
        mapLink: mapLink || existingEvent.mapLink,
        isPublic: isPublic !== undefined ? isPublic === 'true' : existingEvent.isPublic,
        allowExternalJoin: allowExternalJoin !== undefined ? allowExternalJoin === 'true' : existingEvent.allowExternalJoin,
        imageUrl: imageUrl,
        updatedAt: new Date()
      }
    });

    // Actualizar asistentes si se proporcionaron
    if (attendeeIds) {
      console.log('👥 Updating attendees...');
      
      // Eliminar asistentes existentes
      await prisma.eventAttendee.deleteMany({
        where: { eventId: id }
      });

      // Agregar nuevos asistentes
      const attendeeIds_parsed = Array.isArray(attendeeIds) 
        ? attendeeIds 
        : JSON.parse(attendeeIds || '[]');

      if (attendeeIds_parsed.length > 0) {
        await prisma.eventAttendee.createMany({
          data: attendeeIds_parsed.map((attendeeId: string) => ({
            eventId: id,
            userId: attendeeId,
            addedBy: userId,
            status: 'CONFIRMED'
          })),
          skipDuplicates: true
        });
      }
    }

    // Auto-asignar coro si está habilitado
    if (autoAssignChoir === 'true') {
      console.log('🎭 Auto-assigning choir members...');
      
      const event = await prisma.event.findUnique({
        where: { id },
        include: { location: true }
      });

      if (event?.location) {
        const choirMembers = await prisma.user.findMany({
          where: {
            locationId: event.location.id,
            assignedVoiceProfiles: {
              some: {
                voiceType: {
                  in: ['SOPRANO', 'CONTRALTO', 'TENOR', 'BAJO']
                }
              }
            }
          },
          select: { id: true }
        });

        if (choirMembers.length > 0) {
          await prisma.eventAttendee.createMany({
            data: choirMembers.map(member => ({
              eventId: id,
              userId: member.id,
              addedBy: userId,
              status: 'CONFIRMED'
            })),
            skipDuplicates: true
          });
        }
      }
    }

    // Actualizar canciones si se proporcionaron
    if (songIds) {
      console.log('🎵 Updating songs...');
      
      // Eliminar canciones existentes
      await prisma.eventSong.deleteMany({
        where: { eventId: id }
      });

      // Agregar nuevas canciones
      const songIds_parsed = Array.isArray(songIds) 
        ? songIds 
        : JSON.parse(songIds || '[]');
        
      if (songIds_parsed.length > 0) {
        const eventSongs = songIds_parsed.map((songId: string, index: number) => ({
          eventId: id,
          songId: songId,
          order: index + 1
        }));

        await prisma.eventSong.createMany({
          data: eventSongs,
          skipDuplicates: true
        });
      }
    }

    // Obtener el evento completo actualizado para la respuesta
    const completeUpdatedEvent = await prisma.event.findUnique({
      where: { id },
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
        eventSongs: {
          include: {
            song: {
              select: { 
                id: true, 
                title: true, 
                artist: true, 
                duration: true, 
                voiceType: true,
                filePath: true,
                folderName: true,
                fileName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { 
            attendees: true,
            eventSongs: true
          }
        }
      }
    });

    // Create news notification about event update
    if (completeUpdatedEvent) {
      try {
        await NewsService.createEventUpdatedNews(
          completeUpdatedEvent.title,
          completeUpdatedEvent.date.toISOString(),
          completeUpdatedEvent.id,
          completeUpdatedEvent.category || 'Culto'
        );
      } catch (error) {
        console.error('❌ Error creating news for event update:', error);
        // Don't fail the whole event update if news creation fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: completeUpdatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evento'
    });
  }
});

// GET /api/events/locations/singers - Obtener cantantes por ubicación/coro con datos completos
router.get('/locations/singers', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { includeStats = 'true' } = req.query;
    
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: {
            isActive: true,
            assignedRoles: {
              some: {
                role: { in: [UserRole.CANTANTE, UserRole.DIRECTOR] }
              }
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            phone: true,
            createdAt: true,
            assignedRoles: {
              select: { 
                role: true,
                createdAt: true
              }
            },
            voiceProfiles: {
              select: { 
                voiceType: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            },
            eventAttendees: includeStats === 'true' ? {
              select: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    date: true
                  }
                }
              },
              take: 3,
              orderBy: { createdAt: 'desc' }
            } : false,
            _count: includeStats === 'true' ? {
              select: {
                eventAttendees: true,
                songAssignments: true,
                soloPerformances: true
              }
            } : false
          },
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
          ]
        },
        _count: {
          select: { 
            users: {
              where: {
                isActive: true,
                assignedRoles: {
                  some: {
                    role: { in: [UserRole.CANTANTE, UserRole.DIRECTOR] }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Enriquecer datos de ubicaciones y cantantes
    const enrichedLocations = locations.map(location => {
      const singers = location.users.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        primaryRole: user.assignedRoles[0]?.role || 'CANTANTE',
        primaryVoiceType: user.voiceProfiles[0]?.voiceType || 'No asignado',
        allVoiceTypes: user.voiceProfiles.map(vp => vp.voiceType),
        totalEvents: includeStats === 'true' ? (user as any)._count?.eventAttendees || 0 : 0,
        recentEvents: includeStats === 'true' ? (user as any).eventAttendees?.length || 0 : 0,
        isExperienced: includeStats === 'true' ? ((user as any)._count?.eventAttendees || 0) > 5 : false,
        lastEventDate: includeStats === 'true' ? (user as any).eventAttendees?.[0]?.event?.date || null : null
      }));

      // Estadísticas del coro/ubicación
      const voiceTypeDistribution = singers.reduce((acc: any, singer) => {
        const voiceType = singer.primaryVoiceType;
        acc[voiceType] = (acc[voiceType] || 0) + 1;
        return acc;
      }, {});

      const roleDistribution = singers.reduce((acc: any, singer) => {
        const role = singer.primaryRole;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const experienceDistribution = {
        novice: singers.filter(s => s.totalEvents === 0).length,
        beginner: singers.filter(s => s.totalEvents > 0 && s.totalEvents <= 2).length,
        intermediate: singers.filter(s => s.totalEvents > 2 && s.totalEvents <= 5).length,
        experienced: singers.filter(s => s.totalEvents > 5).length
      };

      return {
        ...location,
        singers,
        stats: {
          totalSingers: singers.length,
          voiceTypeDistribution,
          roleDistribution,
          experienceDistribution,
          averageEventsPerSinger: includeStats === 'true' 
            ? Math.round(singers.reduce((sum, s) => sum + s.totalEvents, 0) / singers.length) 
            : 0
        }
      };
    });

    res.json({
      success: true,
      data: enrichedLocations,
      summary: {
        totalLocations: enrichedLocations.length,
        totalSingers: enrichedLocations.reduce((sum, loc) => sum + loc.singers.length, 0),
        activeChoirs: enrichedLocations.filter(loc => loc.singers.length > 0).length
      }
    });
  } catch (error) {
    console.error('Error fetching singers by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cantantes por ubicación'
    });
  }
});

// GET /api/events/search/singers - Búsqueda avanzada de cantantes con filtros
router.get('/search/singers', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { 
      query = '', 
      locationId = '', 
      voiceType = '', 
      role = '', 
      limit = '50' 
    } = req.query;
    
    // Construir filtros dinámicos
    const whereConditions: any = {
      // Incluir tanto activos como inactivos por defecto
      // isActive: true, // Comentado para mostrar todos
      roles: {
        some: {
          role: { in: ['CANTANTE', 'DIRECTOR'] }
        }
      }
    };

    // Filtro por texto de búsqueda
    if (query && (query as string).length >= 1) {
      whereConditions.OR = [
        { firstName: { contains: query as string, mode: 'insensitive' } },
        { lastName: { contains: query as string, mode: 'insensitive' } },
        { email: { contains: query as string, mode: 'insensitive' } },
        { username: { contains: query as string, mode: 'insensitive' } }
      ];
    }

    // Filtro por ubicación/coro
    if (locationId && locationId !== '') {
      whereConditions.locationId = locationId as string;
    }

    // Filtro por tipo de voz
    if (voiceType && voiceType !== '') {
      whereConditions.voiceProfiles = {
        some: {
          voiceType: (voiceType as string).toUpperCase()
        }
      };
    }

    // Filtro por rol específico - corregido
    if (role && role !== '') {
      // Sobreescribir el filtro de roles por defecto si se especifica uno específico
      whereConditions.roles = {
        some: {
          role: (role as string).toUpperCase()
        }
      };
    }

    console.log('Search conditions:', JSON.stringify(whereConditions, null, 2));

    const singers = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        phone: true,
        locationId: true,
        isActive: true,
        createdAt: true,
        location: {
          select: { 
            id: true,
            name: true,
            address: true,
            city: true 
          }
        },
        roles: {
          select: { 
            role: true,
            createdAt: true
          }
        },
        voiceProfiles: {
          select: { 
            voiceType: true,
            createdAt: true
          }
        },
        eventAttendees: {
          select: {
            event: {
              select: {
                id: true,
                title: true,
                date: true
              }
            }
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            eventAttendees: true,
            songAssignments: true,
            soloPerformances: true
          }
        }
      },
      take: parseInt(limit as string),
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    console.log(`Found ${singers.length} singers`);

    // Agregar información adicional procesada
    const enrichedSingers = singers.map(singer => ({
      ...singer,
      fullName: `${singer.firstName} ${singer.lastName}`,
      primaryRole: singer.roles[0]?.role || 'CANTANTE',
      allRoles: singer.roles.map(r => r.role),
      primaryVoiceType: singer.voiceProfiles[0]?.voiceType || 'No asignado',
      allVoiceTypes: singer.voiceProfiles.map(vp => vp.voiceType),
      totalEvents: singer._count.eventAttendees,
      recentEvents: singer.eventAttendees.length,
      isExperienced: singer._count.eventAttendees > 5,
      lastEventDate: singer.eventAttendees[0]?.event?.date || null,
      // Cambiar assignedRoles por roles para compatibilidad con frontend
      assignedRoles: singer.roles
    }));

    res.json({
      success: true,
      data: enrichedSingers,
      total: enrichedSingers.length,
      filters: {
        query: query || '',
        locationId: locationId || '',
        voiceType: voiceType || '',
        role: role || '',
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error searching singers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar cantantes'
    });
  }
});

// GET /api/events/singers/all - Obtener todos los cantantes con datos completos
router.get('/singers/all', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '100', 
      sortBy = 'firstName', 
      sortOrder = 'asc',
      includeInactive = 'false' 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereCondition: any = {
      assignedRoles: {
        some: {
          role: { in: ['CANTANTE' as const, 'DIRECTOR' as const] }
        }
      }
    };

    if (includeInactive !== 'true') {
      whereCondition.isActive = true;
    }

    // Contar total para paginación
    const totalCount = await prisma.user.count({ where: whereCondition });

    const singers = await prisma.user.findMany({
      where: whereCondition,
      include: {
        location: {
          select: { 
            id: true,
            name: true,
            address: true,
            city: true,
            country: true
          }
        },
        assignedRoles: {
          include: { 
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
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
          },
          orderBy: { createdAt: 'desc' }
        },
        eventAttendees: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                date: true
              }
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        songAssignments: {
          include: {
            song: {
              select: {
                title: true,
                artist: true
              }
            }
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        soloPerformances: {
          include: {
            event: {
              select: {
                title: true,
                date: true
              }
            },
            song: {
              select: {
                title: true,
                artist: true
              }
            }
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            eventAttendees: true,
            songAssignments: true,
            soloPerformances: true,
            playlists: true,
            lyricContributions: true
          }
        }
      },
      skip,
      take: parseInt(limit as string),
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      }
    });

    // Enriquecer datos
    const enrichedSingers = singers.map(singer => {
      const totalEvents = singer._count.eventAttendees;
      const recentEvents = singer.eventAttendees.length;
      
      return {
        ...singer,
        fullName: `${singer.firstName} ${singer.lastName}`,
        primaryRole: singer.assignedRoles[0]?.role || 'CANTANTE',
        allRoles: singer.assignedRoles.map((r: any) => r.role),
        primaryVoiceType: singer.voiceProfiles[0]?.voiceType || 'No asignado',
        allVoiceTypes: singer.voiceProfiles.map((vp: any) => vp.voiceType),
        choirName: singer.location?.name || 'Sin asignar',
        locationInfo: singer.location ? 
          `${singer.location.name} - ${singer.location.city}, ${singer.location.country}` : 
          'Sin ubicación asignada',
        stats: {
          totalEvents,
          recentEvents,
          totalSongs: singer._count.songAssignments,
          soloPerformances: singer._count.soloPerformances,
          playlists: singer._count.playlists,
          lyricContributions: singer._count.lyricContributions,
          experienceLevel: totalEvents === 0 ? 'Novato' :
                          totalEvents <= 2 ? 'Principiante' :
                          totalEvents <= 5 ? 'Intermedio' : 'Experimentado',
          isActive: singer.isActive,
          joinDate: singer.createdAt,
          lastUpdate: singer.updatedAt
        },
        recentActivity: {
          lastEvents: singer.eventAttendees.map((ea: any) => ({
            title: ea.event.title,
            date: ea.event.date,
            status: ea.status
          })),
          lastSongs: singer.songAssignments.map((sa: any) => ({
            title: sa.song.title,
            artist: sa.song.artist,
            assignedDate: sa.createdAt
          })),
          lastSolos: singer.soloPerformances.map((sp: any) => ({
            song: `${sp.song.title} - ${sp.song.artist}`,
            event: sp.event.title,
            date: sp.event.date
          }))
        }
      };
    });

    res.json({
      success: true,
      data: enrichedSingers,
      pagination: {
        current_page: parseInt(page as string),
        per_page: parseInt(limit as string),
        total: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit as string)),
        has_next_page: skip + parseInt(limit as string) < totalCount,
        has_prev_page: parseInt(page as string) > 1
      },
      summary: {
        total_singers: totalCount,
        active_singers: enrichedSingers.filter(s => s.isActive).length,
        voice_type_distribution: enrichedSingers.reduce((acc: any, singer) => {
          const voiceType = singer.primaryVoiceType;
          acc[voiceType] = (acc[voiceType] || 0) + 1;
          return acc;
        }, {}),
        experience_distribution: {
          novato: enrichedSingers.filter(s => s.stats.experienceLevel === 'Novato').length,
          principiante: enrichedSingers.filter(s => s.stats.experienceLevel === 'Principiante').length,
          intermedio: enrichedSingers.filter(s => s.stats.experienceLevel === 'Intermedio').length,
          experimentado: enrichedSingers.filter(s => s.stats.experienceLevel === 'Experimentado').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all singers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de cantantes'
    });
  }
});

// GET /api/events/filters/options - Obtener opciones para filtros dinámicos
router.get('/filters/options', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  try {
    // Obtener ubicaciones activas
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
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

    // Obtener tipos de voz únicos
    const voiceTypes = await prisma.userVoiceProfile.findMany({
      select: { voiceType: true },
      distinct: ['voiceType'],
      where: {
        user: {
          isActive: true,
          assignedRoles: {
            some: {
              role: { in: ['CANTANTE', 'DIRECTOR'] }
            }
          }
        }
      }
    });

    // Obtener roles únicos
    const roles = await prisma.userRole_DB.findMany({
      select: { role: true },
      distinct: ['role'],
      where: {
        user: {
          isActive: true
        }
      }
    });

    res.json({
      success: true,
      data: {
        locations: locations.map(loc => ({
          ...loc,
          label: `${loc.name} (${loc._count.users} cantantes)`,
          singersCount: loc._count.users
        })),
        voiceTypes: voiceTypes.map(vt => ({
          value: vt.voiceType,
          label: vt.voiceType
        })),
        roles: roles.map(r => ({
          value: r.role,
          label: r.role
        })),
        experienceLevels: [
          { value: 'novato', label: 'Novato (0 eventos)' },
          { value: 'principiante', label: 'Principiante (1-2 eventos)' },
          { value: 'intermedio', label: 'Intermedio (3-5 eventos)' },
          { value: 'experimentado', label: 'Experimentado (5+ eventos)' }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener opciones de filtros'
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
        eventSongs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                voiceType: true,
                filePath: true,
                folderName: true,
                fileName: true,
                parentSongId: true
              }
            }
          },
          orderBy: { order: 'asc' }
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
            eventSongs: true,
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

// GET /api/events/:id/songs - Obtener canciones de un evento (playlist del evento)
router.get('/:id/songs', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const eventSongs = await prisma.eventSong.findMany({
      where: { eventId: id },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            artist: true,
            duration: true,
            voiceType: true,
            filePath: true,
            folderName: true,
            fileName: true,
            parentSongId: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Calcular duración total
    const totalDuration = eventSongs.reduce((total, item) => {
      return total + (item.song.duration || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        songs: eventSongs.map(item => item.song),
        totalSongs: eventSongs.length,
        totalDuration
      }
    });
  } catch (error) {
    console.error('Error fetching event songs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener canciones del evento'
    });
  }
});

// POST /api/events/:id/play - Agregar todas las canciones del evento a la cola de reproducción
router.post('/:id/play', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];
    
    const eventSongs = await prisma.eventSong.findMany({
      where: { eventId: id },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            artist: true,
            duration: true,
            voiceType: true,
            filePath: true,
            folderName: true,
            fileName: true,
            parentSongId: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    if (eventSongs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Este evento no tiene canciones configuradas'
      });
    }

    let filteredSongs = eventSongs.map(item => item.song);
    
    // Aplicar filtrado de voice types si es CANTANTE
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    if (isCantante && !isAdmin && !isDirector) {
      // Obtener voice types del usuario
      const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
        where: { userId: userId },
        select: { voiceType: true }
      });
      
      const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
      const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
      
      filteredSongs = filteredSongs.filter(song => {
        // Si no tiene voiceType, considerarlo como ORIGINAL (permitido)
        if (!song.voiceType) return true;
        return allowedVoiceTypes.includes(song.voiceType);
      });
    }

    res.json({
      success: true,
      message: `Se agregaron ${filteredSongs.length} canciones del evento a la cola de reproducción`,
      data: {
        songs: filteredSongs,
        totalSongs: filteredSongs.length,
        playingFirst: filteredSongs[0] || null
      }
    });
  } catch (error) {
    console.error('Error playing event songs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reproducir evento'
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

    console.log(`🔄 Processing join request response: EventID=${id}, RequestID=${requestId}, Status=${status}, UserID=${userId}`);

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Solo se permite APPROVED o REJECTED'
      });
    }

    // Buscar la solicitud con el evento incluido
    const joinRequest = await prisma.eventJoinRequest.findUnique({
      where: { id: requestId },
      include: { 
        event: true,
        user: { 
          select: { 
            firstName: true, 
            lastName: true, 
            email: true 
          } 
        }
      }
    });

    if (!joinRequest || joinRequest.eventId !== id) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar permisos: solo el creador del evento o ADMIN puede responder
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { assignedRoles: { select: { role: true } } }
    });

    const isAdmin = user?.assignedRoles?.some((role: any) => role.role === 'ADMIN');
    const isEventCreator = joinRequest.event.createdBy === userId;

    if (!isAdmin && !isEventCreator) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador del evento o un administrador puede responder a las solicitudes'
      });
    }

    console.log(`✅ Permission check passed. IsAdmin=${isAdmin}, IsEventCreator=${isEventCreator}`);

    // Actualizar el estado de la solicitud
    const updatedRequest = await prisma.eventJoinRequest.update({
      where: { id: requestId },
      data: {
        status,
        response: response || (status === 'APPROVED' ? 'Solicitud aprobada' : 'Solicitud rechazada'),
        updatedAt: new Date()
      },
      include: {
        user: { 
          select: { 
            firstName: true, 
            lastName: true, 
            email: true 
          } 
        }
      }
    });

    console.log(`📝 Request updated:`, updatedRequest);

    // Si se acepta la solicitud, agregar como asistente EXTERNO
    if (status === 'APPROVED') {
      try {
        await prisma.eventAttendee.create({
          data: {
            eventId: id,
            userId: joinRequest.userId,
            addedBy: userId,
            status: 'CONFIRMED',
            isExternal: true, // 🆕 Marcar como asistente externo
            notes: `🔗 EXTERNO: Agregado por solicitud externa. Aprobado por: ${user?.firstName} ${user?.lastName || ''}`
          } as any
        });
        console.log(`✅ User ${joinRequest.userId} added as external attendee to event ${id}`);
      } catch (attendeeError: any) {
        // Si ya existe como asistente, simplemente continuar
        if (attendeeError.code === 'P2002') {
          console.log(`⚠️ User ${joinRequest.userId} already exists as attendee`);
        } else {
          throw attendeeError;
        }
      }
    }

    res.json({
      success: true,
      message: `Solicitud ${status === 'APPROVED' ? 'aceptada' : 'rechazada'} exitosamente`,
      data: updatedRequest
    });

    console.log(`✅ Join request response completed successfully`);
  } catch (error) {
    console.error('❌ Error responding to join request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al responder solicitud'
    });
  }
});

// DELETE /api/events/:id/join-request - Cancelar solicitud de unión
router.delete('/:id/join-request', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    console.log(`🗑️ Canceling join request for EventID=${id}, UserID=${userId}`);

    // Verificar que la solicitud existe
    const existingRequest = await prisma.eventJoinRequest.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'No tienes solicitudes pendientes para este evento'
      });
    }

    // Solo se pueden cancelar solicitudes pendientes
    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden cancelar solicitudes pendientes'
      });
    }

    // Eliminar la solicitud
    await prisma.eventJoinRequest.delete({
      where: { id: existingRequest.id }
    });

    console.log(`✅ Join request cancelled successfully for EventID=${id}, UserID=${userId}`);

    res.json({
      success: true,
      message: 'Solicitud cancelada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error canceling join request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar solicitud'
    });
  }
});

// GET /api/events/:id/playlist - Obtener playlist del evento (como las playlists normales)
router.get('/:id/playlist', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventSongs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                voiceType: true,
                filePath: true,
                folderName: true,
                fileName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Formatear como playlist
    const playlist = {
      id: event.id,
      name: event.title,
      description: event.description,
      isPublic: event.isPublic,
      totalSongs: event.eventSongs.length,
      totalDuration: event.eventSongs.reduce((total, item) => {
        return total + (item.song.duration || 0);
      }, 0),
      items: event.eventSongs.map(eventSong => ({
        id: eventSong.id,
        order: eventSong.order,
        song: eventSong.song
      })),
      type: 'event' // Para distinguir de playlists normales
    };

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Error fetching event playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener playlist del evento'
    });
  }
});

// POST /api/events/:id/play - Reproducir evento como playlist
router.post('/:id/play', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventSongs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                voiceType: true,
                filePath: true,
                folderName: true,
                fileName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    if (event.eventSongs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El evento no tiene canciones para reproducir'
      });
    }

    // Formatear canciones para la cola de reproducción
    let songs = event.eventSongs.map(eventSong => eventSong.song);

    // Aplicar filtrado de voice types si es CANTANTE
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    if (isCantante && !isAdmin && !isDirector) {
      // Obtener voice types del usuario
      const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
        where: { userId: userId },
        select: { voiceType: true }
      });
      
      const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
      const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
      
      songs = songs.filter(song => {
        // Si no tiene voiceType, considerarlo como ORIGINAL (permitido)
        if (!song.voiceType) return true;
        return allowedVoiceTypes.includes(song.voiceType);
      });
    }

    res.json({
      success: true,
      data: {
        eventId: event.id,
        eventTitle: event.title,
        songs: songs,
        totalSongs: songs.length,
        currentSong: songs[0] // Primer canción de la lista
      },
      message: `Reproduciendo evento: ${event.title}`
    });
  } catch (error) {
    console.error('Error playing event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reproducir evento'
    });
  }
});

// PUT /api/events/:id/attendance-confirmation - Confirmar/Negar asistencia
router.put('/:id/attendance-confirmation', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceConfirmed, nonAttendanceComment } = req.body;
    const userId = (req as any).user.id;

    console.log(`📝 Attendance confirmation for EventID=${id}, UserID=${userId}, Confirmed=${attendanceConfirmed}`);

    // Determinar el status basado en la confirmación
    let status;
    if (attendanceConfirmed === true) {
      status = 'CONFIRMED';
    } else if (attendanceConfirmed === false) {
      status = 'REFUSED';
    } else {
      status = 'PENDING';
    }

    // Verificar que el usuario es asistente del evento
    const attendee = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      },
      include: {
        event: {
          select: { title: true }
        }
      }
    });

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'No estás registrado como asistente en este evento'
      });
    }

    // Validar comentario si no va a asistir
    if (attendanceConfirmed === false && nonAttendanceComment && nonAttendanceComment.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'El comentario de inasistencia no puede exceder 300 caracteres'
      });
    }

    // Actualizar confirmación de asistencia usando el campo status
    const updatedAttendee = await prisma.eventAttendee.update({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      },
      data: {
        status: status as any,
        attendanceConfirmed: attendanceConfirmed, // Mantener compatibilidad
        nonAttendanceComment: attendanceConfirmed === false ? nonAttendanceComment : null
      } as any
    });

    res.status(200).json({
      success: true,
      message: attendanceConfirmed 
        ? 'Asistencia confirmada exitosamente' 
        : 'Inasistencia registrada exitosamente',
      data: updatedAttendee
    });
  } catch (error) {
    console.error('❌ Error confirming attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar asistencia'
    });
  }
});

// POST /api/events/:id/resubmit-join-request - Reenviar solicitud rechazada (apelación)
router.post('/:id/resubmit-join-request', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = (req as any).user.id;

    console.log(`🔄 Resubmitting join request for EventID=${id}, UserID=${userId}`);

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

    // Verificar que existe una solicitud rechazada
    const existingRequest = await prisma.eventJoinRequest.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'No tienes solicitudes previas para este evento'
      });
    }

    if (existingRequest.status !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes reenviar solicitudes que hayan sido rechazadas'
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

    // Actualizar la solicitud existente a PENDING
    const resubmittedRequest = await prisma.eventJoinRequest.update({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      },
      data: {
        message,
        status: 'PENDING',
        response: null // Limpiar respuesta anterior
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, locationId: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Solicitud reenviada exitosamente',
      data: resubmittedRequest
    });
  } catch (error) {
    console.error('❌ Error resubmitting join request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar solicitud'
    });
  }
});

export default router;