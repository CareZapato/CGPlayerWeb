import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload, handleMulterError } from '../middleware/upload';
import { multiUpload, handleMultiUploadError, validateAudioFiles, cleanupInvalidFiles } from '../middleware/multiUpload';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

// Subir canción
router.post('/upload', authenticateToken, upload.single('audio'), handleMulterError, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const { title, artist, album, genre, voiceType, parentSongId } = req.body;

    if (!title) {
      // Eliminar archivo si no se proporciona título
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    // Si es una versión por voz, verificar que existe la canción padre
    if (parentSongId) {
      const parentSong = await prisma.song.findUnique({
        where: { id: parentSongId, isActive: true }
      });

      if (!parentSong) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Parent song not found' });
      }
    }

    // Crear registro en la base de datos
    const song = await prisma.song.create({
      data: {
        title: voiceType ? `${title} (${voiceType})` : title,
        artist: artist || null,
        album: album || null,
        genre: genre || null,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        voiceType: voiceType || null,
        parentSongId: parentSongId || null,
        uploadedBy: req.user!.id
      },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        parentSong: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Song uploaded successfully',
      song
    });

  } catch (error) {
    // Eliminar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading song:', error);
    res.status(500).json({ message: 'Failed to upload song' });
  }
});

// Subir múltiples canciones con asignación de voces
router.post('/multi-upload', authenticateToken, multiUpload.array('audio', 10), handleMultiUploadError, async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No audio files provided' });
    }

    // Validar archivos de audio
    const { valid: validFiles, invalid: invalidFiles } = validateAudioFiles(files);
    
    if (invalidFiles.length > 0) {
      // Limpiar archivos no válidos
      const invalidFileObjects = files.filter(file => invalidFiles.includes(file.originalname));
      cleanupInvalidFiles(invalidFileObjects);
    }

    if (validFiles.length === 0) {
      return res.status(400).json({ 
        message: 'No valid audio files found',
        invalidFiles 
      });
    }

    const { 
      parentSongId, 
      voiceAssignments, // JSON string: {"filename1.mp3": "SOPRANO", "filename2.mp3": "TENOR"}
      title, 
      artist, 
      album, 
      genre 
    } = req.body;

    let voiceMap: Record<string, string> = {};
    try {
      voiceMap = voiceAssignments ? JSON.parse(voiceAssignments) : {};
    } catch (error) {
      // Limpiar archivos si hay error de parsing
      cleanupInvalidFiles(validFiles);
      return res.status(400).json({ message: 'Invalid voice assignments format' });
    }

    const uploadedSongs = [];
    const errors = [];

    for (const file of validFiles) {
      try {
        const voiceType = voiceMap[file.originalname] || null;
        
        const songData = {
          title: title || path.basename(file.originalname, path.extname(file.originalname)),
          artist: artist || null,
          album: album || null,
          genre: genre || null,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          voiceType: voiceType as any,
          parentSongId: parentSongId || null,
          uploadedBy: req.user!.id
        };

        const song = await prisma.song.create({
          data: songData,
          include: {
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        uploadedSongs.push({
          ...song,
          originalFilename: file.originalname,
          voiceType: voiceType
        });

      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: 'Failed to save to database'
        });
        
        // Eliminar archivo en caso de error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    const response: any = {
      message: `Successfully uploaded ${uploadedSongs.length} of ${validFiles.length} files`,
      uploadedSongs,
      summary: {
        total: files.length,
        valid: validFiles.length,
        uploaded: uploadedSongs.length,
        errors: errors.length
      }
    };

    if (invalidFiles.length > 0) {
      response.invalidFiles = invalidFiles;
    }

    if (errors.length > 0) {
      response.errors = errors;
    }

    const statusCode = uploadedSongs.length > 0 ? 201 : 400;
    res.status(statusCode).json(response);

  } catch (error) {
    // Limpiar todos los archivos en caso de error crítico
    if (req.files) {
      cleanupInvalidFiles(req.files as Express.Multer.File[]);
    }
    console.error('Error in multi-upload:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

// Obtener todas las canciones
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { voiceType, includeVersions = 'false' } = req.query;
    
    const where: any = { isActive: true };
    
    if (voiceType && typeof voiceType === 'string') {
      where.voiceType = voiceType;
    }

    // Si no incluir versiones, solo mostrar canciones principales (sin parentSongId)
    if (includeVersions !== 'true') {
      where.parentSongId = null;
    }

    const songs = await prisma.song.findMany({
      where,
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        parentSong: {
          select: {
            id: true,
            title: true
          }
        },
        childVersions: {
          where: { isActive: true },
          include: {
            uploader: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            playlistItems: true,
            lyrics: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ message: 'Failed to fetch songs' });
  }
});

// Obtener canción específica
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const song = await prisma.song.findUnique({
      where: { id, isActive: true },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        lyrics: {
          where: { isActive: true },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ message: 'Failed to fetch song' });
  }
});

// Asignar canción a usuario con tipo de voz
router.post('/:id/assign', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, voiceType } = req.body;

    // Verificar que la canción existe
    const song = await prisma.song.findUnique({
      where: { id, isActive: true }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Verificar que el usuario tiene ese tipo de voz asignado
    const voiceProfile = await prisma.userVoiceProfile.findUnique({
      where: {
        userId_voiceType: {
          userId,
          voiceType
        }
      }
    });

    if (!voiceProfile) {
      return res.status(400).json({ message: 'User does not have this voice type assigned' });
    }

    // Crear asignación
    const assignment = await prisma.songAssignment.upsert({
      where: {
        songId_userId_voiceType: {
          songId: id,
          userId,
          voiceType
        }
      },
      update: {},
      create: {
        songId: id,
        userId,
        voiceType
      },
      include: {
        user: {
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
      message: 'Song assigned successfully',
      assignment
    });

  } catch (error) {
    console.error('Error assigning song:', error);
    res.status(500).json({ message: 'Failed to assign song' });
  }
});

// Eliminar canción
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const song = await prisma.song.findUnique({
      where: { id }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Solo el uploader o un admin/director puede eliminar
    if (song.uploadedBy !== req.user!.id && !['ADMIN', 'DIRECTOR'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this song' });
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
