import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Configuración de riesgo de asistencia (configurable)
const RISK_ATTENDANCE_THRESHOLD = 0.3; // 30% - esto se podría mover a una tabla de configuración

// Función para calcular cantantes en riesgo
async function calculateRiskySingers(locationId?: string) {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  
  // Obtener eventos de tipo "Ensayo" del año actual QUE YA HAN OCURRIDO
  // Solo consideramos ensayos pasados para calcular el riesgo de asistencia
  // Los ensayos futuros no deben influir en el cálculo del porcentaje actual
  const rehearsalEvents = await prisma.event.findMany({
    where: {
      category: 'Ensayo',
      date: {
        gte: new Date(currentYear, 0, 1), // Desde el inicio del año
        lte: currentDate // Hasta la fecha actual (solo ensayos pasados)
      },
      ...(locationId ? { locationId } : {})
    },
    select: { id: true }
  });

  if (rehearsalEvents.length === 0) {
    return {}; // No hay ensayos, no hay cantantes en riesgo
  }

  const rehearsalEventIds = rehearsalEvents.map(e => e.id);
  
  // Obtener todos los usuarios y sus asistencias a ensayos
  const usersFilter = locationId ? { locationId } : {};
  const users = await prisma.user.findMany({
    where: {
      ...usersFilter,
      isActive: true
    },
    select: {
      id: true,
      locationId: true
    }
  });

  const riskCalculations: Record<string, { total: number; refused: number; isRisky: boolean }> = {};

  for (const user of users) {
    // Contar asistencias del usuario a ensayos
    const attendanceRecords = await prisma.eventAttendee.findMany({
      where: {
        userId: user.id,
        eventId: { in: rehearsalEventIds }
      },
      select: {
        status: true,
        nonAttendanceComment: true
      }
    });

    const totalInvitations = attendanceRecords.length;
    const refusedWithoutExcuse = attendanceRecords.filter(
      record => record.status === 'REFUSED' && !record.nonAttendanceComment
    ).length;

    if (totalInvitations > 0) {
      const attendanceRate = 1 - (refusedWithoutExcuse / totalInvitations);
      riskCalculations[user.id] = {
        total: totalInvitations,
        refused: refusedWithoutExcuse,
        isRisky: attendanceRate < RISK_ATTENDANCE_THRESHOLD
      };
    }
  }

  return riskCalculations;
}

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

    // Calcular cantantes en riesgo
    const riskData = await calculateRiskySingers(
      isDirector && !isAdmin ? user?.locationId : undefined
    );

    // Obtener datos básicos mejorados
    const currentDate = new Date();
    
    const [
      totalUsers, 
      activeUsers, 
      totalSongs, 
      songVariations,
      totalEvents,
      pendingEvents,
      totalRehearsals,
      pendingRehearsals
    ] = await Promise.all([
      // Usuarios totales
      prisma.user.count({
        where: locationFilter
      }),
      // Usuarios activos
      prisma.user.count({
        where: {
          ...locationFilter,
          isActive: true
        }
      }),
      // Canciones principales
      prisma.song.count({
        where: {
          isActive: true,
          parentSongId: null // Solo canciones principales
        }
      }),
      // Variaciones de canciones (canciones derivadas)
      prisma.song.count({
        where: {
          isActive: true,
          parentSongId: { not: null } // Solo variaciones
        }
      }),
      // Total de eventos
      prisma.event.count({
        where: isDirector && !isAdmin && user?.locationId 
          ? { locationId: user.locationId }
          : {}
      }),
      // Eventos pendientes (futuros)
      prisma.event.count({
        where: {
          date: { gt: currentDate },
          category: 'Evento',
          ...(isDirector && !isAdmin && user?.locationId 
            ? { locationId: user.locationId }
            : {})
        }
      }),
      // Total de ensayos
      prisma.event.count({
        where: {
          category: 'Ensayo',
          ...(isDirector && !isAdmin && user?.locationId 
            ? { locationId: user.locationId }
            : {})
        }
      }),
      // Ensayos pendientes (futuros)
      prisma.event.count({
        where: {
          date: { gt: currentDate },
          category: 'Ensayo',
          ...(isDirector && !isAdmin && user?.locationId 
            ? { locationId: user.locationId }
            : {})
        }
      })
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
                voiceType: true,
                isPrimary: true
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
      // Distribuir usuarios por tipo de voz (TODAS LAS VOCES)
      const voiceDistribution: Record<string, { count: number; users: any[] }> = {};
      // Distribuir usuarios por voz primaria únicamente
      const primaryVoiceDistribution: Record<string, { count: number; users: any[] }> = {};
      
      // Filtrar solo ubicaciones que tienen usuarios
      const allUsers = location.users;
      const activeUsers = allUsers.filter(user => user.isActive);
      const riskyUsers = allUsers.filter(user => riskData[user.id]?.isRisky);
      const inactiveUsers = allUsers.filter(user => !user.isActive);
      
      if (allUsers.length === 0) return null; // Excluir ubicaciones sin usuarios
      
      allUsers.forEach(user => {
        // Procesar TODAS las voces
        user.voiceProfiles.forEach(vp => {
          if (!voiceDistribution[vp.voiceType]) {
            voiceDistribution[vp.voiceType] = { count: 0, users: [] };
          }
          voiceDistribution[vp.voiceType].count++;
          
          // Determinar el estado del usuario
          let userStatus = 'active';
          if (!user.isActive) {
            userStatus = 'inactive';
          } else if (riskData[user.id]?.isRisky) {
            userStatus = 'risky';
          }
          
          voiceDistribution[vp.voiceType].users.push({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive,
            status: userStatus,
            riskData: riskData[user.id] || null,
            isPrimary: vp.isPrimary
          });
        });

        // Procesar solo VOZ PRIMARIA
        const primaryVoice = user.voiceProfiles.find(vp => vp.isPrimary);
        if (primaryVoice) {
          if (!primaryVoiceDistribution[primaryVoice.voiceType]) {
            primaryVoiceDistribution[primaryVoice.voiceType] = { count: 0, users: [] };
          }
          primaryVoiceDistribution[primaryVoice.voiceType].count++;
          
          // Determinar el estado del usuario
          let userStatus = 'active';
          if (!user.isActive) {
            userStatus = 'inactive';
          } else if (riskData[user.id]?.isRisky) {
            userStatus = 'risky';
          }
          
          primaryVoiceDistribution[primaryVoice.voiceType].users.push({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive,
            status: userStatus,
            riskData: riskData[user.id] || null,
            isPrimary: true
          });
        }
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
        riskyUsers: riskyUsers.length,
        inactiveUsers: inactiveUsers.length,
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
        })),
        primaryVoiceDistribution: Object.entries(primaryVoiceDistribution).map(([voiceType, data]) => ({
          voiceType,
          count: data.count,
          users: data.users
        }))
      };
    }).filter(Boolean); // Eliminar ubicaciones null (sin usuarios)

    // Obtener distribución global de tipos de voz con usuarios incluidos (TODAS LAS VOCES)
    const allUsersDetailed = await prisma.user.findMany({
      where: locationFilter,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        profileImage: true,
        voiceProfiles: {
          select: {
            voiceType: true,
            isPrimary: true
          }
        }
      }
    });

    // Distribución de TODAS las voces (puede incluir duplicados)
    const globalVoiceStats: Record<string, { count: number; activeCount: number; riskyCount: number; inactiveCount: number; users: any[] }> = {};
    allUsersDetailed.forEach(user => {
      user.voiceProfiles.forEach(vp => {
        if (!globalVoiceStats[vp.voiceType]) {
          globalVoiceStats[vp.voiceType] = { count: 0, activeCount: 0, riskyCount: 0, inactiveCount: 0, users: [] };
        }
        globalVoiceStats[vp.voiceType].count++;
        
        // Determinar el estado del usuario
        let userStatus = 'active';
        if (!user.isActive) {
          userStatus = 'inactive';
          globalVoiceStats[vp.voiceType].inactiveCount++;
        } else if (riskData[user.id]?.isRisky) {
          userStatus = 'risky';
          globalVoiceStats[vp.voiceType].riskyCount++;
        } else {
          globalVoiceStats[vp.voiceType].activeCount++;
        }
        
        globalVoiceStats[vp.voiceType].users.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive,
          profileImage: user.profileImage,
          status: userStatus,
          riskData: riskData[user.id] || null,
          isPrimary: vp.isPrimary
        });
      });
    });

    const globalVoiceDistribution = Object.entries(globalVoiceStats).map(([voiceType, data]) => ({
      voiceType,
      count: data.count,
      activeCount: data.activeCount,
      riskyCount: data.riskyCount,
      inactiveCount: data.inactiveCount,
      users: data.users
    }));

    // Distribución de VOCES PRIMARIAS únicamente (sin duplicados)
    const primaryVoiceStats: Record<string, { count: number; activeCount: number; riskyCount: number; inactiveCount: number; users: any[] }> = {};
    allUsersDetailed.forEach(user => {
      // Solo considerar voces primarias
      const primaryVoice = user.voiceProfiles.find(vp => vp.isPrimary);
      if (primaryVoice) {
        if (!primaryVoiceStats[primaryVoice.voiceType]) {
          primaryVoiceStats[primaryVoice.voiceType] = { count: 0, activeCount: 0, riskyCount: 0, inactiveCount: 0, users: [] };
        }
        primaryVoiceStats[primaryVoice.voiceType].count++;
        
        // Determinar el estado del usuario
        let userStatus = 'active';
        if (!user.isActive) {
          userStatus = 'inactive';
          primaryVoiceStats[primaryVoice.voiceType].inactiveCount++;
        } else if (riskData[user.id]?.isRisky) {
          userStatus = 'risky';
          primaryVoiceStats[primaryVoice.voiceType].riskyCount++;
        } else {
          primaryVoiceStats[primaryVoice.voiceType].activeCount++;
        }
        
        primaryVoiceStats[primaryVoice.voiceType].users.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive,
          profileImage: user.profileImage,
          status: userStatus,
          riskData: riskData[user.id] || null,
          isPrimary: true
        });
      }
    });

    const primaryVoiceDistribution = Object.entries(primaryVoiceStats).map(([voiceType, data]) => ({
      voiceType,
      count: data.count,
      activeCount: data.activeCount,
      riskyCount: data.riskyCount,
      inactiveCount: data.inactiveCount,
      users: data.users
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
        date: true,
        category: true,
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
        // Estadísticas de usuarios mejoradas
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          risky: Object.values(riskData).filter(r => r.isRisky).length
        },
        
        // Estadísticas de canciones mejoradas
        songs: {
          total: totalSongs,
          variations: songVariations,
          totalWithVariations: totalSongs + songVariations
        },
        
        // Estadísticas de eventos mejoradas
        events: {
          total: totalEvents,
          pending: pendingEvents
        },
        
        // Estadísticas de ensayos mejoradas
        rehearsals: {
          total: totalRehearsals,
          pending: pendingRehearsals
        },
        
        // Estadísticas de sedes
        locations: {
          total: processedLocations.length,
          details: processedLocations
        },
        
        // Distribuciones de voces
        voiceDistribution: {
          global: globalVoiceDistribution,
          primary: primaryVoiceDistribution
        },
        
        // Eventos recientes
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          title: event.title,
          category: event.category || 'Culto',
          dateTime: event.date,
          location: event.location
        })),
        
        // Configuración y metadatos
        config: {
          riskThreshold: RISK_ATTENDANCE_THRESHOLD,
          currentYear: new Date().getFullYear(),
          isFiltered: isDirector && !isAdmin,
          filterLocation: isDirector && !isAdmin ? user?.locationId : null
        },
        
        // Mantener compatibilidad con versión anterior (deprecated)
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        riskyUsers: Object.values(riskData).filter(r => r.isRisky).length,
        totalSongs,
        totalEvents,
        totalLocations: processedLocations.length,
        globalVoiceDistribution,
        primaryVoiceDistribution,
        riskConfig: {
          attendanceThreshold: RISK_ATTENDANCE_THRESHOLD,
          currentYear: new Date().getFullYear()
        },
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