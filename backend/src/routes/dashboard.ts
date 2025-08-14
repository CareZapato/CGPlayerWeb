import express, { Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Obtener estadísticas completas del dashboard (solo ADMIN)
router.get('/stats', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // Obtener datos en paralelo para mejor rendimiento
    const [users, songs, events] = await Promise.all([
      // Usuarios activos con ubicación y perfiles de voz
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isActive: true,
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
      }),
      
      // Canciones principales (sin versiones hijas)
      prisma.song.findMany({
        select: {
          id: true,
          title: true,
          parentSongId: true,
          voiceType: true,
          isActive: true
        },
        where: {
          isActive: true
        }
      }),

      // Eventos
      prisma.event.findMany({
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
        }
      })
    ]);

    // Procesar estadísticas de usuarios
    const usersByLocation = users.reduce((acc: any, user: any) => {
      const location = user.location?.name || 'Sin ubicación';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    const usersByVoiceType = users.reduce((acc: any, user: any) => {
      user.voiceProfiles?.forEach((profile: any) => {
        acc[profile.voiceType] = (acc[profile.voiceType] || 0) + 1;
      });
      return acc;
    }, {});

    const usersByRole = users.reduce((acc: any, user: any) => {
      user.roles?.forEach((userRole: any) => {
        acc[userRole.role] = (acc[userRole.role] || 0) + 1;
      });
      return acc;
    }, {});

    // Contar canciones principales (que no tienen parentSongId)
    const mainSongs = songs.filter(song => !song.parentSongId);
    
    // Contar versiones por tipo de voz
    const songsByVoiceType = songs.reduce((acc: any, song: any) => {
      if (song.voiceType) {
        acc[song.voiceType] = (acc[song.voiceType] || 0) + 1;
      }
      return acc;
    }, {});

    // Eventos recientes (últimos 5)
    const recentEvents = events.slice(0, 5);

    res.json({
      success: true,
      data: {
        // Contadores principales
        totalUsers: users.length,
        totalSongs: mainSongs.length,
        totalEvents: events.length,
        
        // Distribución de usuarios
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
        })),
        
        // Distribución de canciones
        songsByVoiceType: Object.entries(songsByVoiceType).map(([voiceType, count]) => ({
          voiceType,
          count: count as number
        })),
        
        // Eventos recientes
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          title: event.title,
          category: event.category,
          dateTime: event.date,
          location: event.location
        }))
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
