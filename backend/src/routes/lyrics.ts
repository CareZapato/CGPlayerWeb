import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// GET /api/lyrics/files/:fileId - Servir archivo de letras
router.get('/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const lyricsFile = await (prisma as any).lyricsFile.findUnique({
      where: { id: fileId }
    });
    
    if (!lyricsFile) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    
    const filePath = path.join(__dirname, '../../uploads/lyrics', path.basename(lyricsFile.filePath));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo físico no encontrado' });
    }
    
    // Establecer headers apropiados
    res.setHeader('Content-Type', lyricsFile.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${lyricsFile.fileName}"`);
    
    // Enviar archivo
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving lyrics file:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Configuración de multer para subida de archivos de letras
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/lyrics');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const songId = req.params.songId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${songId}_${sanitizedName}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no válido. Solo se permiten PDF, DOC, DOCX, TXT, JPG y PNG.'));
    }
  }
});

// Función para determinar el tipo de archivo
function getFileType(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'PDF';
    case 'application/msword':
      return 'DOC';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'DOCX';
    case 'text/plain':
      return 'TEXT';
    case 'image/jpeg':
      return 'IMAGE_JPG';
    case 'image/png':
      return 'IMAGE_PNG';
    default:
      return 'TEXT';
  }
}

// GET /api/lyrics/:songId - Obtener todas las letras de una canción (archivos y sincronizaciones)
router.get('/:songId', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { voiceType } = req.query;

    // Verificar que la canción existe
    const song = await (prisma as any).song.findUnique({
      where: { id: songId },
      include: {
        lyricsFiles: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        lyrics: {
          where: {
            isActive: true,
            ...(voiceType && voiceType !== 'main' ? { voiceType: voiceType as any } : 
                voiceType === 'main' ? { voiceType: null } : {})
          },
          orderBy: [
            { voiceType: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    res.json({
      success: true,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        voiceType: song.voiceType,
        hasLyricSync: (song as any).hasLyricSync,
        lyricsFiles: (song as any).lyricsFiles,
        lyrics: (song as any).lyrics
      }
    });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/lyrics/:songId/file - Subir archivo de letras
router.post('/:songId/file', authenticateToken, upload.single('lyrics'), async (req, res) => {
  try {
    const { songId } = req.params;
    const file = req.file;
    const userId = (req as any).user.userId;

    if (!file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Verificar que la canción existe
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    // Crear registro del archivo en la base de datos
    const lyricsFileModel = (prisma as any).lyricsFile;
    const lyricsFile = await lyricsFileModel.create({
      data: {
        songId,
        fileName: file.originalname,
        filePath: `/uploads/lyrics/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: getFileType(file.mimetype) as any,
        uploadedBy: userId
      }
    });

    res.json({
      success: true,
      message: 'Archivo de letras subido exitosamente',
      file: lyricsFile
    });
  } catch (error) {
    console.error('Error uploading lyrics file:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/lyrics/:songId/text - Actualizar letras de texto para una variante específica
router.put('/:songId/text', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { content, voiceType = null, isTextOnly = false } = req.body;
    const userId = (req as any).user.userId;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'Contenido de letras requerido' });
    }

    // Verificar que la canción existe
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    // Si es solo texto (no sincronización), crear una entrada de texto simple
    if (isTextOnly) {
      // Eliminar letras de texto existentes para este voiceType
      await (prisma as any).lyric.deleteMany({
        where: {
          songId,
          voiceType,
          isTextLyrics: true
        }
      });

      // Crear entrada de texto completo
      const textLyric = await (prisma as any).lyric.create({
        data: {
          songId,
          content: 'Letras completas', // Título descriptivo
          textContent: content, // Contenido completo
          startTime: null,
          endTime: null,
          lineNumber: 0,
          voiceType,
          isTextLyrics: true,
          createdBy: userId
        }
      });

      console.log(`📝 Texto de letras guardado para ${voiceType || 'general'}`);
      return res.json({ 
        success: true, 
        message: 'Letras de texto guardadas exitosamente',
        lyric: textLyric 
      });
    }

    // Resto del código para sincronización...
    // Verificar si es la primera vez que se guardan letras para esta canción
    const existingLyrics = await (prisma as any).lyric.findMany({
      where: {
        songId,
        isTextLyrics: false, // Solo sincronizaciones
        startTime: {
          not: 0 // Solo las que ya tienen sincronización real
        }
      }
    });

    const isFirstTimeSync = existingLyrics.length === 0;

    // Si es la primera vez, crear letras sincronizadas para todos los voice types
    if (isFirstTimeSync) {
      console.log(`🎵 Primera sincronización para canción ${songId}, creando para todos los voiceTypes`);

      // Lista de todos los voice types posibles
      const allVoiceTypes = [null, 'SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO', 'CORO'];

      // Dividir el contenido en líneas
      const lines = content.split('\n').filter(line => line.trim() !== '');

      for (const vType of allVoiceTypes) {
        // Primero eliminar letras existentes para este voiceType
        await (prisma as any).lyric.deleteMany({
          where: {
            songId,
            voiceType: vType,
            isTextLyrics: false
          }
        });

        // Crear nuevas entradas para cada línea
        for (let i = 0; i < lines.length; i++) {
          await (prisma as any).lyric.create({
            data: {
              songId,
              content: lines[i],
              startTime: 0, // Tiempo inicial en 0 para sincronización posterior
              endTime: 0,
              lineNumber: i + 1,
              voiceType: vType,
              isTextLyrics: false,
              createdBy: userId
            }
          });
        }
      }
    }

    // Buscar o crear entrada de letra de texto para esta variante específica
    const existingTextLyric = await (prisma as any).lyric.findFirst({
      where: {
        songId,
        voiceType: voiceType,
        isTextLyrics: true
      }
    });

    let textLyric;
    if (existingTextLyric) {
      // Actualizar existente
      textLyric = await (prisma as any).lyric.update({
        where: { id: existingTextLyric.id },
        data: {
          textContent: content,
          content: content.substring(0, 255), // Guardar preview en content
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nueva
      textLyric = await (prisma as any).lyric.create({
        data: {
          songId,
          content: content.substring(0, 255), // Preview
          textContent: content, // Contenido completo
          lineNumber: 0, // Línea 0 para letras de texto completas
          voiceType: voiceType,
          isTextLyrics: true,
          createdBy: userId
        }
      });
    }

    // Actualizar flag de sincronización si es necesario
    await (prisma as any).song.update({
      where: { id: songId },
      data: { hasLyricSync: true }
    });

    res.json({
      success: true,
      message: 'Letras de texto actualizadas exitosamente',
      lyric: textLyric
    });
  } catch (error) {
    console.error('Error updating text lyrics:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/lyrics/:songId/sync - Obtener letras sincronizadas por variante
router.get('/:songId/sync', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { voiceType } = req.query;

    const lyrics = await (prisma as any).lyric.findMany({
      where: {
        songId,
        isActive: true,
        isTextLyrics: false, // Solo sincronizaciones, no letras de texto completas
        ...(voiceType && voiceType !== 'main' ? { voiceType: voiceType as any } : 
            voiceType === 'main' ? { voiceType: null } : {})
      },
      orderBy: [
        { voiceType: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({
      success: true,
      lyrics
    });
  } catch (error) {
    console.error('Error fetching synced lyrics:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/lyrics/:songId/sync - Actualizar sincronización de letras por variante
router.put('/:songId/sync', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { syncData } = req.body;
    const userId = (req as any).user.userId;

    if (!Array.isArray(syncData)) {
      return res.status(400).json({ message: 'syncData debe ser un array' });
    }

    // Verificar que la canción existe
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    // Obtener el voiceType del primer elemento
    const voiceType = syncData.length > 0 ? syncData[0].voiceType : null;

    // Verificar si es la primera sincronización real (no son todos ceros)
    const hasRealTiming = syncData.some(item => 
      (item.startTime && item.startTime > 0) || (item.endTime && item.endTime > 0)
    );

    // Verificar si ya existen sincronizaciones reales para esta canción
    const existingRealSync = await (prisma as any).lyric.findFirst({
      where: {
        songId,
        isTextLyrics: false,
        OR: [
          { startTime: { gt: 0 } },
          { endTime: { gt: 0 } }
        ]
      }
    });

    const isFirstRealSync = !existingRealSync && hasRealTiming;

    if (isFirstRealSync) {
      console.log(`🎵 Primera sincronización real para canción ${songId}, aplicando a todos los voiceTypes`);

      // Lista de todos los voice types posibles
      const allVoiceTypes = [null, 'SOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO', 'CORO'];

      // Aplicar la misma sincronización a todos los voice types
      for (const vType of allVoiceTypes) {
        // Eliminar sincronizaciones existentes para este voiceType
        await (prisma as any).lyric.deleteMany({
          where: {
            songId,
            voiceType: vType,
            isTextLyrics: false
          }
        });

        // Crear nuevas sincronizaciones
        await Promise.all(
          syncData.map((item: any, index: number) => 
            (prisma as any).lyric.create({
              data: {
                songId,
                content: item.content,
                startTime: item.startTime,
                endTime: item.endTime,
                lineNumber: item.lineNumber || index + 1,
                voiceType: vType,
                isTextLyrics: false,
                createdBy: userId
              }
            })
          )
        );
      }
    } else {
      // Solo actualizar el voiceType específico
      console.log(`🎵 Actualizando sincronización específica para voiceType: ${voiceType}`);

      // Eliminar sincronizaciones existentes para esta variante específica
      await (prisma as any).lyric.deleteMany({
        where: {
          songId,
          voiceType: voiceType,
          isTextLyrics: false
        }
      });

      // Crear nuevas sincronizaciones solo para este voiceType
      await Promise.all(
        syncData.map((item: any, index: number) => 
          (prisma as any).lyric.create({
            data: {
              songId,
              content: item.content,
              startTime: item.startTime,
              endTime: item.endTime,
              lineNumber: item.lineNumber || index + 1,
              voiceType: item.voiceType,
              isTextLyrics: false,
              createdBy: userId
            }
          })
        )
      );
    }

    // Actualizar flag de sincronización
    await (prisma as any).song.update({
      where: { id: songId },
      data: { hasLyricSync: true }
    });

    res.json({
      success: true,
      message: isFirstRealSync 
        ? 'Sincronización aplicada a todos los voiceTypes exitosamente'
        : 'Sincronización de letras actualizada exitosamente',
      syncType: isFirstRealSync ? 'all' : 'specific'
    });
  } catch (error) {
    console.error('Error updating lyrics sync:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/lyrics/:songId/file/:fileId - Eliminar archivo específico
router.delete('/:songId/file/:fileId', authenticateToken, async (req, res) => {
  try {
    const { songId, fileId } = req.params;

    const lyricsFileModel = (prisma as any).lyricsFile;
    const lyricsFile = await lyricsFileModel.findFirst({
      where: {
        id: fileId,
        songId,
        isActive: true
      }
    });

    if (!lyricsFile) {
      return res.status(404).json({ message: 'Archivo de letras no encontrado' });
    }

    // Marcar como inactivo en lugar de eliminar
    await lyricsFileModel.update({
      where: { id: fileId },
      data: { isActive: false }
    });

    // Opcional: eliminar archivo físico
    const fullPath = path.join(__dirname, '../../', lyricsFile.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({
      success: true,
      message: 'Archivo de letras eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting lyrics file:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/lyrics/:songId - Eliminar todas las letras de una canción
router.delete('/:songId', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;

    const lyricsFileModel = (prisma as any).lyricsFile;
    
    // Eliminar archivos de letras
    await lyricsFileModel.updateMany({
      where: { songId },
      data: { isActive: false }
    });

    // Eliminar letras y sincronizaciones
    await (prisma as any).lyric.updateMany({
      where: { songId },
      data: { isActive: false }
    });

    // Actualizar flag de la canción
    await (prisma as any).song.update({
      where: { id: songId },
      data: { hasLyricSync: false }
    });

    res.json({
      success: true,
      message: 'Todas las letras eliminadas exitosamente'
    });
  } catch (error) {
    console.error('Error deleting lyrics:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
