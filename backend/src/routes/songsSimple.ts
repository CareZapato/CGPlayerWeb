import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Obtener todas las canciones (temporalmente simplificado)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const songs = await prisma.song.findMany({
      where: { isActive: true },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ message: 'Failed to fetch songs' });
  }
});

// Eliminar canción (admin o uploader)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const song = await prisma.song.findUnique({
      where: { id }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Solo el admin o el usuario que subió la canción pueden eliminarla
    const hasAdminRole = req.user!.roles.some((role: string) => role === 'ADMIN');
    if (!hasAdminRole && song.uploadedBy !== userId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Marcar como inactiva en lugar de eliminar
    await prisma.song.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ message: 'Failed to delete song' });
  }
});

export default router;
