import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Obtener estadísticas del dashboard (ADMIN y DIRECTOR)
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isAdmin = user?.roles?.includes('ADMIN');
    const isDirector = user?.roles?.includes('DIRECTOR');

    // Si es director, solo puede ver datos de su ubicación
    const locationFilter = isDirector && !isAdmin && user?.locationId 
      ? { locationId: user.locationId }
      : {};

    // Obtener datos básicos
    const [totalUsers, activeUsers, totalSongs, totalEvents] = await Promise.all([
      prisma.user.count({
        where: {
          ...locationFilter,
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          ...locationFilter,
          isActive: true
        }
      }),
      prisma.song.count({
        where: {
          isActive: true,
          parentSongId: null // Solo canciones principales
        }
      }),
      prisma.event.count()
    ]);

    // Obtener ubicaciones con datos detallados para el nuevo dashboard
    const locationWhere = isDirector && !isAdmin && user?.locationId 
      ? { id: user.locationId }
      : {};

    const locations = await prisma.location.findMany({
      where: locationWhere,
      include: {
        users: {
          include: {
            voiceProfiles: {
              select: {
                voiceType: true
              }
            },
            roles: {
              where: { role: 'DIRECTOR' },
              select: {
                role: true
              }
            }
          }
        }
      }
    });

    // Obtener directores por ubicación
    const directorsData = await Promise.all(
      locations.map(async (location) => {
        const director = await prisma.user.findFirst({
          where: {
            locationId: location.id,
            isActive: true,
            roles: {
              some: {
                role: 'DIRECTOR'
              }
            }
          }
        });
        return { locationId: location.id, director };
      })
    );

    // Procesar datos de ubicaciones para el formato del dashboard
    const processedLocations = locations.map(location => {
      // Distribuir usuarios por tipo de voz
      const voiceDistribution: Record<string, { count: number; users: any[] }> = {};
      
      // Filtrar solo ubicaciones que tienen usuarios
      const allUsers = location.users;
      const activeUsers = allUsers.filter(user => user.isActive);
      
      if (allUsers.length === 0) return null; // Excluir ubicaciones sin usuarios
      
      allUsers.forEach(user => {
        user.voiceProfiles.forEach(vp => {
          if (!voiceDistribution[vp.voiceType]) {
            voiceDistribution[vp.voiceType] = { count: 0, users: [] };
          }
          voiceDistribution[vp.voiceType].count++;
          voiceDistribution[vp.voiceType].users.push({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive
          });
        });
      });

      const directorInfo = directorsData.find(d => d.locationId === location.id)?.director;

      return {
        locationId: location.id,
        locationName: location.name,
        city: location.city,
        address: location.address || '',
        color: location.color || '#3B82F6',
        phone: location.phone,
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        director: directorInfo ? {
          id: directorInfo.id,
          firstName: directorInfo.firstName,
          lastName: directorInfo.lastName,
          email: directorInfo.email,
          phone: (directorInfo as any).phone || null
        } : null,
        voiceDistribution: Object.entries(voiceDistribution).map(([voiceType, data]) => ({
          voiceType,
          count: data.count,
          users: data.users
        }))
      };
    }).filter(Boolean); // Eliminar ubicaciones null (sin usuarios)

    // Obtener distribución global de tipos de voz
    const allUsers = await prisma.user.findMany({
      where: locationFilter,
      select: {
        isActive: true,
        voiceProfiles: {
          select: {
            voiceType: true
          }
        }
      }
    });

    const globalVoiceStats: Record<string, { count: number; activeCount: number }> = {};
    allUsers.forEach(user => {
      user.voiceProfiles.forEach(vp => {
        if (!globalVoiceStats[vp.voiceType]) {
          globalVoiceStats[vp.voiceType] = { count: 0, activeCount: 0 };
        }
        globalVoiceStats[vp.voiceType].count++;
        if (user.isActive) {
          globalVoiceStats[vp.voiceType].activeCount++;
        }
      });
    });

    const globalVoiceDistribution = Object.entries(globalVoiceStats).map(([voiceType, data]) => ({
      voiceType,
      count: data.count,
      activeCount: data.activeCount
    }));

    // Eventos recientes
    const eventWhere = isDirector && !isAdmin && user?.locationId 
      ? { locationId: user.locationId }
      : {};

    const recentEvents = await prisma.event.findMany({
      where: eventWhere,
      select: {
        id: true,
        title: true,
        category: true,
        date: true,
        location: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalSongs,
        totalEvents,
        totalLocations: processedLocations.length,
        locations: processedLocations,
        globalVoiceDistribution,
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          title: event.title,
          category: event.category,
          dateTime: event.date,
          location: event.location
        })),
        // Metadatos para el frontend
        isFiltered: isDirector && !isAdmin,
        filterLocation: isDirector && !isAdmin ? user?.locationId : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;