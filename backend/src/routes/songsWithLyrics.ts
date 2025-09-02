import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createSongWithLyricsTransaction } from '../services/songLyricsService';
import { prisma } from '../utils/prisma';
import { VoiceType } from '@prisma/client';

const router = Router();

// POST /api/songs-with-lyrics - Crear canción con letras en una transacción
router.post('/with-lyrics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      artist, 
      uploadedVariants, 
      lyricsText, 
      replaceExistingLyrics = false 
    } = req.body;

    console.log(`🎵 [SONGS-LYRICS] Creating song with lyrics: ${title}`);
    console.log(`📄 [SONGS-LYRICS] Variants: ${uploadedVariants?.length || 0}`);
    console.log(`📝 [SONGS-LYRICS] Lyrics length: ${lyricsText?.length || 0} chars`);

    // Validaciones
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required and must be a string' 
      });
    }

    if (!lyricsText || typeof lyricsText !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Lyrics text is required' 
      });
    }

    if (!uploadedVariants || !Array.isArray(uploadedVariants) || uploadedVariants.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one uploaded variant is required' 
      });
    }

    // Validar que los voiceTypes sean válidos
    const validVoiceTypes: VoiceType[] = [
      'SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 
      'MESOSOPRANO', 'BAJO', 'CORO', 'ORIGINAL'
    ];

    for (const variant of uploadedVariants) {
      if (!validVoiceTypes.includes(variant.voiceType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid voiceType: ${variant.voiceType}`,
          validVoiceTypes
        });
      }

      // Validar campos requeridos de cada variante
      if (!variant.fileName || !variant.filePath || !variant.fileSize || !variant.mimeType) {
        return res.status(400).json({
          success: false,
          message: 'Each variant must have fileName, filePath, fileSize, and mimeType',
          invalidVariant: variant
        });
      }
    }

    // Crear la canción con letras usando el servicio transaccional
    const result = await createSongWithLyricsTransaction(prisma, {
      title,
      artist,
      uploadedVariants,
      lyricsText,
      replaceExistingLyrics,
      uploadedBy: req.user!.id
    });

    console.log(`✅ [SONGS-LYRICS] Successfully created song and lyrics`);
    console.log(`📂 [SONGS-LYRICS] Parent ID: ${result.parentSong.id}`);
    console.log(`📄 [SONGS-LYRICS] Variants: ${result.variants.length}`);
    console.log(`📝 [SONGS-LYRICS] Lyrics created: ${result.lyricsCreated}`);

    res.status(201).json({
      success: true,
      message: 'Song with lyrics created successfully',
      data: {
        parentSong: {
          id: result.parentSong.id,
          title: result.parentSong.title,
          artist: result.parentSong.artist
        },
        variants: result.variants.map(v => ({
          id: v.id,
          title: v.title,
          voiceType: v.voiceType,
          fileName: v.fileName
        })),
        statistics: {
          variantsCreated: result.variants.length,
          totalTargets: result.targets.length,
          lyricsCreated: result.lyricsCreated,
          lyricsLines: result.lyricsLines
        }
      }
    });

  } catch (error) {
    console.error('❌ [SONGS-LYRICS] Error creating song with lyrics:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating song with lyrics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

// GET /api/songs-with-lyrics/:parentId/structure - Obtener estructura completa de una canción
router.get('/:parentId/structure', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { parentId } = req.params;

    // Obtener todas las canciones (padre + variantes)
    const songs = await prisma.song.findMany({
      where: {
        OR: [
          { id: parentId },
          { parentSongId: parentId }
        ]
      },
      include: {
        lyrics: {
          orderBy: { lineNumber: 'asc' }
        }
      },
      orderBy: { voiceType: 'asc' }
    });

    if (songs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }

    const parentSong = songs.find(s => !s.parentSongId);
    const variants = songs.filter(s => s.parentSongId);

    console.log(`📋 [SONGS-LYRICS] Retrieved structure for: ${parentSong?.title}`);
    console.log(`📄 [SONGS-LYRICS] Variants: ${variants.length}`);

    res.json({
      success: true,
      data: {
        parent: parentSong ? {
          id: parentSong.id,
          title: parentSong.title,
          artist: parentSong.artist,
          voiceType: parentSong.voiceType,
          lyricsCount: parentSong.lyrics.length,
          hasLyrics: parentSong.lyrics.length > 0
        } : null,
        variants: variants.map(variant => ({
          id: variant.id,
          title: variant.title,
          voiceType: variant.voiceType,
          fileName: variant.fileName,
          lyricsCount: variant.lyrics.length,
          hasLyrics: variant.lyrics.length > 0
        })),
        statistics: {
          totalSongs: songs.length,
          totalVariants: variants.length,
          totalLyrics: songs.reduce((sum, song) => sum + song.lyrics.length, 0)
        }
      }
    });

  } catch (error) {
    console.error('❌ [SONGS-LYRICS] Error getting song structure:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving song structure',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

export default router;
