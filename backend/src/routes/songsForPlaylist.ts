import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/songs/for-playlist - Obtener canciones disponibles para playlists del usuario
router.get('/for-playlist', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Obtener perfil de voz del usuario
    const userVoiceProfile = await prisma.userVoiceProfile.findFirst({
      where: {
        userId: userId
      }
    });

    let voiceTypes = ['ORIGINAL', 'CORO']; // Tipos siempre disponibles
    
    // Agregar el tipo de voz específico del usuario si lo tiene
    if (userVoiceProfile) {
      voiceTypes.push(userVoiceProfile.voiceType);
    }

    const songs = await prisma.song.findMany({
      where: {
        isActive: true,
        voiceType: {
          in: voiceTypes as any[]
        }
      },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { title: 'asc' },
        { artist: 'asc' }
      ]
    });

    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs for playlist:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
