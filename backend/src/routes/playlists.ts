import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Crear lista de reproducción
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, voiceType, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description || null,
        voiceType: voiceType || null,
        isPublic: isPublic || false,
        userId: req.user!.id
      },
      include: {
        user: {
          select: {
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
      message: 'Playlist created successfully',
      playlist
    });

  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Failed to create playlist' });
  }
});

// Obtener listas de reproducción del usuario
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { voiceType } = req.query;

    const whereClause: any = {
      OR: [
        { userId: req.user!.id },
        { isPublic: true }
      ]
    };

    if (voiceType) {
      whereClause.voiceType = voiceType;
    }

    const playlists = await prisma.playlist.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
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
                duration: true
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

    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ message: 'Failed to fetch playlists' });
  }
});

// Obtener lista de reproducción específica
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user!.id },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            song: {
              include: {
                uploader: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ message: 'Failed to fetch playlist' });
  }
});

// Agregar canción a lista de reproducción
router.post('/:id/songs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    // Verificar que la playlist pertenece al usuario
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or not authorized' });
    }

    // Verificar que la canción existe
    const song = await prisma.song.findUnique({
      where: { id: songId, isActive: true }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Obtener el siguiente order
    const lastItem = await prisma.playlistItem.findFirst({
      where: { playlistId: id },
      orderBy: { order: 'desc' }
    });

    const nextOrder = lastItem ? lastItem.order + 1 : 1;

    // Agregar canción a la playlist
    const playlistItem = await prisma.playlistItem.create({
      data: {
        playlistId: id,
        songId,
        order: nextOrder
      },
      include: {
        song: {
          select: {
            title: true,
            artist: true,
            duration: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Song added to playlist successfully',
      playlistItem
    });

  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ message: 'Failed to add song to playlist' });
  }
});

// Eliminar canción de lista de reproducción
router.delete('/:id/songs/:songId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, songId } = req.params;

    // Verificar que la playlist pertenece al usuario
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or not authorized' });
    }

    // Eliminar item de la playlist
    await prisma.playlistItem.deleteMany({
      where: {
        playlistId: id,
        songId
      }
    });

    res.json({ message: 'Song removed from playlist successfully' });

  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({ message: 'Failed to remove song from playlist' });
  }
});

// Actualizar lista de reproducción
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, voiceType, isPublic } = req.body;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or not authorized' });
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: { id },
      data: {
        name: name || playlist.name,
        description: description !== undefined ? description : playlist.description,
        voiceType: voiceType !== undefined ? voiceType : playlist.voiceType,
        isPublic: isPublic !== undefined ? isPublic : playlist.isPublic
      },
      include: {
        user: {
          select: {
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

    res.json({
      message: 'Playlist updated successfully',
      playlist: updatedPlaylist
    });

  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ message: 'Failed to update playlist' });
  }
});

// Eliminar lista de reproducción
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or not authorized' });
    }

    await prisma.playlist.delete({
      where: { id }
    });

    res.json({ message: 'Playlist deleted successfully' });

  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Failed to delete playlist' });
  }
});

export default router;
