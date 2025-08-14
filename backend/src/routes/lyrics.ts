import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Crear letra para canción
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { songId, content, timestamp, voiceType } = req.body;

    if (!songId || !content) {
      return res.status(400).json({ message: 'Song ID and content are required' });
    }

    // Verificar que la canción existe
    const song = await prisma.song.findUnique({
      where: { id: songId, isActive: true }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const lyric = await prisma.lyric.create({
      data: {
        songId,
        content,
        timestamp: timestamp || null,
        voiceType: voiceType || null,
        createdBy: req.user!.id
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        song: {
          select: {
            title: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Lyric created successfully',
      lyric
    });

  } catch (error) {
    console.error('Error creating lyric:', error);
    res.status(500).json({ message: 'Failed to create lyric' });
  }
});

// Obtener letras de una canción
router.get('/song/:songId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { songId } = req.params;
    const { voiceType } = req.query;

    const whereClause: any = {
      songId,
      isActive: true
    };

    if (voiceType) {
      whereClause.OR = [
        { voiceType },
        { voiceType: null } // Letras generales
      ];
    }

    const lyrics = await prisma.lyric.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    res.json(lyrics);
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ message: 'Failed to fetch lyrics' });
  }
});

// Actualizar letra
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, timestamp, voiceType } = req.body;

    // Verificar que la letra existe y pertenece al usuario o es admin/director
    const lyric = await prisma.lyric.findUnique({
      where: { id }
    });

    if (!lyric) {
      return res.status(404).json({ message: 'Lyric not found' });
    }

    const hasAdminPermission = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (lyric.createdBy !== req.user!.id && !hasAdminPermission) {
      return res.status(403).json({ message: 'Not authorized to edit this lyric' });
    }

    const updatedLyric = await prisma.lyric.update({
      where: { id },
      data: {
        content: content || lyric.content,
        timestamp: timestamp !== undefined ? timestamp : lyric.timestamp,
        voiceType: voiceType !== undefined ? voiceType : lyric.voiceType
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        song: {
          select: {
            title: true
          }
        }
      }
    });

    res.json({
      message: 'Lyric updated successfully',
      lyric: updatedLyric
    });

  } catch (error) {
    console.error('Error updating lyric:', error);
    res.status(500).json({ message: 'Failed to update lyric' });
  }
});

// Eliminar letra
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lyric = await prisma.lyric.findUnique({
      where: { id }
    });

    if (!lyric) {
      return res.status(404).json({ message: 'Lyric not found' });
    }

    const hasAdminPermissionForDelete = req.user!.roles.some((role: string) => ['ADMIN'].includes(role));
    if (lyric.createdBy !== req.user!.id && !hasAdminPermissionForDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this lyric' });
    }

    // Marcar como inactiva en lugar de eliminar
    await prisma.lyric.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Lyric deleted successfully' });

  } catch (error) {
    console.error('Error deleting lyric:', error);
    res.status(500).json({ message: 'Failed to delete lyric' });
  }
});

export default router;
