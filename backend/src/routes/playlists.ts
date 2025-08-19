import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configuración de multer para imágenes de playlist
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images/playlists');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `playlist-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// GET /api/playlists - Obtener playlists del usuario actual
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const playlists = await prisma.playlist.findMany({
      where: {
        OR: [
          { userId: userId }, // Playlists del usuario
          { isPublic: true }   // Playlists públicas
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                voiceType: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calcular duración total para cada playlist
    const playlistsWithDuration = playlists.map(playlist => {
      const totalDuration = playlist.items.reduce((total, item) => {
        return total + (item.song.duration || 0);
      }, 0);

      return {
        ...playlist,
        totalDuration,
        totalSongs: playlist._count.items
      };
    });

    res.json(playlistsWithDuration);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/playlists - Crear nueva playlist
router.post('/', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user?.id;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Nombre y usuario son requeridos' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/images/playlists/${req.file.filename}`;
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description || null,
        userId,
        isPublic: isPublic === 'true' || isPublic === true,
        imageUrl
      } as any,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    res.status(201).json({
      ...playlist,
      totalDuration: 0,
      totalSongs: 0,
      items: []
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/playlists/search - Buscar playlists
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { q, creator } = req.query;
    const userId = req.user?.id;

    const whereCondition: any = {
      OR: [
        { userId: userId },
        { isPublic: true }
      ]
    };

    if (q) {
      whereCondition.AND = whereCondition.AND || [];
      whereCondition.AND.push({
        name: {
          contains: q as string,
          mode: 'insensitive'
        }
      });
    }

    if (creator) {
      whereCondition.AND = whereCondition.AND || [];
      whereCondition.AND.push({
        user: {
          OR: [
            {
              username: {
                contains: creator as string,
                mode: 'insensitive'
              }
            },
            {
              firstName: {
                contains: creator as string,
                mode: 'insensitive'
              }
            },
            {
              lastName: {
                contains: creator as string,
                mode: 'insensitive'
              }
            }
          ]
        }
      });
    }

    const playlists = await prisma.playlist.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                voiceType: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calcular duración total para cada playlist
    const playlistsWithDuration = playlists.map(playlist => {
      const totalDuration = playlist.items.reduce((total, item) => {
        return total + (item.song.duration || 0);
      }, 0);

      return {
        ...playlist,
        totalDuration,
        totalSongs: playlist._count.items
      };
    });

    res.json(playlistsWithDuration);
  } catch (error) {
    console.error('Error searching playlists:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/playlists/:id - Obtener playlist específica
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        OR: [
          { userId: userId },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            song: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    const totalDuration = playlist.items.reduce((total, item) => {
      return total + (item.song.duration || 0);
    }, 0);

    res.json({
      ...playlist,
      totalDuration,
      totalSongs: playlist.items.length
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/playlists/:id/songs - Agregar canción a playlist
router.post('/:id/songs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;
    const userId = req.user?.id;

    // Verificar que la playlist pertenece al usuario
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada o no tienes permisos' });
    }

    // Obtener el próximo orden
    const lastItem = await prisma.playlistItem.findFirst({
      where: { playlistId: id },
      orderBy: { order: 'desc' }
    });

    const nextOrder = (lastItem?.order || 0) + 1;

    const playlistItem = await prisma.playlistItem.create({
      data: {
        playlistId: id,
        songId,
        order: nextOrder
      },
      include: {
        song: true
      }
    });

    res.status(201).json(playlistItem);
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/playlists/:id/songs/:songId - Remover canción de playlist
router.delete('/:id/songs/:songId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, songId } = req.params;
    const userId = req.user?.id;

    // Verificar que la playlist pertenece al usuario
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada o no tienes permisos' });
    }

    await prisma.playlistItem.deleteMany({
      where: {
        playlistId: id,
        songId: songId
      }
    });

    res.json({ message: 'Canción removida de la playlist' });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/playlists/:id - Eliminar playlist
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada o no tienes permisos' });
    }

    // Eliminar imagen si existe
    if ((playlist as any).imageUrl) {
      const imagePath = path.join(__dirname, '../../', (playlist as any).imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.playlist.delete({
      where: { id }
    });

    res.json({ message: 'Playlist eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
