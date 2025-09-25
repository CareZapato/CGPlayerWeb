import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

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

// Configuración de multer para la carga de imágenes de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images/profiles');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar conflictos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Obtener perfil del usuario actual
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Buscar usuario con todos los campos incluyendo profileImage, tipos de voz y roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        voiceProfiles: {
          include: {
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        roles: {
          include: {
            assignedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            color: true,
            type: true
          }
        }
      }
    }) as any;

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Construir URL completa de la imagen si existe
    let profileImageUrl = null;
    if (user.profileImage) {
      // Usar protocolo desde variable de entorno, fallback a HTTP para evitar errores SSL
      const protocol = process.env.IMAGE_URL_PROTOCOL || (process.env.NODE_ENV === 'production' ? 'http' : 'http');
      const host = getServerIP();
      const port = process.env.PORT || '3001';
      profileImageUrl = `${protocol}://${host}:${port}/api/uploads/images/profiles/${user.profileImage}`;
      
      console.log('🖼️ [BACKEND] URL de imagen generada:', profileImageUrl);
    }

    // Formatear tipos de voz con información de voz primaria
    const voiceTypes = user.voiceProfiles.map((vp: any) => ({
      voiceType: vp.voiceType,
      isPrimary: vp.isPrimary,
      assignedBy: vp.assignedByUser ? 
        `${vp.assignedByUser.firstName} ${vp.assignedByUser.lastName}` : 
        'Sistema',
      assignedAt: vp.createdAt
    }));

    // Encontrar la voz primaria
    const primaryVoice = voiceTypes.find((vt: any) => vt.isPrimary);

    // Formatear roles del usuario
    const userRoles = user.roles.map((ur: any) => ({
      role: ur.role,
      assignedBy: ur.assignedByUser ? 
        `${ur.assignedByUser.firstName} ${ur.assignedByUser.lastName}` : 
        'Sistema',
      assignedAt: ur.createdAt
    }));

    // Obtener el rol principal (el más alto en jerarquía)
    const roleHierarchy = ['ADMIN', 'DIRECTOR', 'CANTANTE'];
    const primaryRole = userRoles.find((ur: any) => ur.role === 'ADMIN') ||
                       userRoles.find((ur: any) => ur.role === 'DIRECTOR') ||
                       userRoles.find((ur: any) => ur.role === 'CANTANTE') ||
                       null;

    res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      profileImageUrl,
      voiceTypes,
      primaryVoice,
      userRoles,
      primaryRole,
      location: user.location,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar información personal del usuario
router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, email, username, phone } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Validaciones básicas
    if (!firstName || !lastName || !email || !username) {
      return res.status(400).json({ 
        error: 'Los campos nombre, apellido, email y usuario son obligatorios' 
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Verificar si el username o email ya están en uso por otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { username },
              { email }
            ]
          }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        username,
        phone: phone || null
      }
    }) as any;

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar contraseña
router.put('/me/password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'La contraseña actual y la nueva contraseña son obligatorias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Obtener el usuario actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Subir imagen de perfil
router.post('/me/image', authenticateToken, upload.single('profileImage'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Obtener usuario actual para eliminar imagen anterior si existe
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (currentUser?.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/images/profiles', currentUser.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Actualizar usuario con nueva imagen
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: req.file.filename
      } as any
    }) as any;

    const protocol = process.env.IMAGE_URL_PROTOCOL || (process.env.NODE_ENV === 'production' ? 'http' : 'http');
    const host = getServerIP();
    const port = process.env.PORT || '3001';
    const profileImageUrl = `${protocol}://${host}:${port}/api/uploads/images/profiles/${updatedUser.profileImage}`;
    
    console.log('🖼️ [BACKEND] Nueva imagen subida:', {
      filename: req.file.filename,
      profileImageUrl,
      userId
    });

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      profileImage: updatedUser.profileImage,
      profileImageUrl
    });

  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar imagen de perfil
router.delete('/me/image', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (!user?.profileImage) {
      return res.status(400).json({ error: 'No hay imagen de perfil para eliminar' });
    }

    // Eliminar archivo físico
    const imagePath = path.join(__dirname, '../../uploads/images/profiles', user.profileImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Actualizar base de datos
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null } as any
    });

    res.json({ message: 'Imagen de perfil eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar imagen de perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas reales del usuario por temporadas
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    console.log('📊 [BACKEND] Obteniendo estadísticas para usuario:', userId);

    // Obtener todas las solicitudes de unión a eventos del usuario (EventJoinRequest)
    // Estas representan las solicitudes a ensayos/eventos 
    const eventJoinRequests = await prisma.eventJoinRequest.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            date: true,
            title: true,
            category: true
          }
        }
      }
    });

    // Obtener asistencias confirmadas a eventos (EventAttendee)
    const eventAttendees = await prisma.eventAttendee.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            date: true,
            title: true,
            category: true
          }
        }
      }
    });

    console.log('📊 [BACKEND] Solicitudes encontradas:', {
      joinRequests: eventJoinRequests.length,
      attendees: eventAttendees.length
    });

    // Agrupar por año y calcular estadísticas
    const statsByYear = new Map<number, any>();

    // Procesar solicitudes de unión (EventJoinRequest)
    eventJoinRequests.forEach((request: any) => {
      const year = new Date(request.event.date).getFullYear();
      const category = request.event.category || 'Culto';
      
      if (!statsByYear.has(year)) {
        statsByYear.set(year, {
          year,
          ensayosAsistidos: 0,
          ensayosFaltas: 0,
          ensayosInasistencias: 0,
          totalEnsayos: 0,
          eventosAsistidos: 0,
          totalEventos: 0,
          porcentajeAsistencia: 0
        });
      }

      const yearStats = statsByYear.get(year);

      // Considerar "Ensayo" y "Culto" como ensayos para las estadísticas
      if (category === 'Ensayo' || category === 'Culto') {
        yearStats.totalEnsayos++;
        
        switch (request.status) {
          case 'APPROVED':
            yearStats.ensayosAsistidos++;
            break;
          case 'REJECTED':
            // Si hay mensaje en response podríamos considerarlo justificado
            if (request.message) {
              yearStats.ensayosInasistencias++; // Con justificación
            } else {
              yearStats.ensayosFaltas++; // Sin justificación
            }
            break;
        }
      } else {
        // Otros tipos de eventos
        yearStats.totalEventos++;
        if (request.status === 'APPROVED') {
          yearStats.eventosAsistidos++;
        }
      }
    });

    // Procesar asistentes agregados directamente (EventAttendee)
    eventAttendees.forEach((attendee: any) => {
      const year = new Date(attendee.event.date).getFullYear();
      const category = attendee.event.category || 'Culto';
      
      if (!statsByYear.has(year)) {
        statsByYear.set(year, {
          year,
          ensayosAsistidos: 0,
          ensayosFaltas: 0,
          ensayosInasistencias: 0,
          totalEnsayos: 0,
          eventosAsistidos: 0,
          totalEventos: 0,
          porcentajeAsistencia: 0
        });
      }

      const yearStats = statsByYear.get(year);

      // Considerar "Ensayo" y "Culto" como ensayos
      if (category === 'Ensayo' || category === 'Culto') {
        yearStats.totalEnsayos++;
        
        switch (attendee.status) {
          case 'CONFIRMED':
            yearStats.ensayosAsistidos++;
            break;
          case 'REFUSED':
            // Revisar si hay comentario de no asistencia
            if (attendee.nonAttendanceComment) {
              yearStats.ensayosInasistencias++; // Con justificación
            } else {
              yearStats.ensayosFaltas++; // Sin justificación
            }
            break;
        }
      } else {
        // Otros tipos de eventos
        yearStats.totalEventos++;
        if (attendee.status === 'CONFIRMED') {
          yearStats.eventosAsistidos++;
        }
      }
    });

    // Calcular porcentajes de asistencia y convertir a array
    const seasonStats = Array.from(statsByYear.values()).map(stats => ({
      ...stats,
      porcentajeAsistencia: stats.totalEnsayos > 0 
        ? (stats.ensayosAsistidos / stats.totalEnsayos) * 100 
        : 0
    })).sort((a, b) => b.year - a.year); // Ordenar de más reciente a más antiguo

    console.log('📊 [BACKEND] Estadísticas calculadas:', seasonStats);

    res.json(seasonStats);

  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
