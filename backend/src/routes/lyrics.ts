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
    
    // Construir la ruta correcta del archivo
    const filePath = path.join(__dirname, '../../uploads', lyricsFile.filePath);
    
    
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ [LYRICS FILE] File not found at path:', filePath);
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

// Configuración de multer para subir archivos de letras
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/lyrics');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `lyrics-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// POST /api/lyrics/:songId/upload - Subir archivo de letras
router.post('/:songId/upload', authenticateToken, upload.single('lyricsFile'), async (req, res) => {
  try {
    const { songId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }
    
    // Verificar que la canción existe
    const song = await (prisma as any).song.findUnique({
      where: { id: songId }
    });
    
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    
    // Guardar información del archivo en la base de datos
    const lyricsFile = await (prisma as any).lyricsFile.create({
      data: {
        fileName: file.originalname,
        filePath: `lyrics/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        songId: songId
      }
    });
    
    res.json({
      message: 'Archivo subido exitosamente',
      file: {
        id: lyricsFile.id,
        fileName: lyricsFile.fileName,
        mimeType: lyricsFile.mimeType,
        size: lyricsFile.size,
        url: `/api/lyrics/files/${lyricsFile.id}`
      }
    });
  } catch (error) {
    console.error('Error uploading lyrics file:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/lyrics/:songId/text - Guardar letras como texto
router.put('/:songId/text', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { text, voiceType } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Texto de letras requerido' });
    }
    
    if (!voiceType) {
      return res.status(400).json({ message: 'Tipo de voz requerido para guardar letras' });
    }
    
    // Verificar que la canción existe
    const song = await (prisma as any).song.findUnique({
      where: { id: songId }
    });
    
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    
    // LÓGICA CORREGIDA: Solo buscar songs que realmente existen con el voiceType específico
    
    let targetSongId: string;
    let targetVoiceType: string = voiceType;
    
    // Primero, buscar si existe alguna song relacionada que tenga exactamente el voiceType solicitado
    let targetSong = null;
    
    // Caso 1: Si el song actual ya tiene el voiceType correcto
    if (song.voiceType === voiceType) {
      targetSong = song;
      } else {
      // Caso 2: Buscar en hermanos (songs con mismo padre o mismo parentSongId)
      const searchConditions = [];
      
      if (song.parentSongId) {
        // Si el song actual es una variante, buscar entre hermanos
        searchConditions.push({ parentSongId: song.parentSongId });
        // También incluir el padre
        searchConditions.push({ id: song.parentSongId });
      } else {
        // Si el song actual es padre, buscar entre sus variantes
        searchConditions.push({ parentSongId: song.id });
        // También incluir el mismo song padre por si tiene voiceType null
        searchConditions.push({ id: song.id });
      }
      
      if (searchConditions.length > 0) {
        targetSong = await (prisma as any).song.findFirst({
          where: {
            voiceType: voiceType,
            OR: searchConditions
          },
          select: {
            id: true,
            title: true,
            voiceType: true,
            parentSongId: true
          }
        });
        
        if (targetSong) {
          }
      }
    }
    
    // Si no encontramos ninguna song con el voiceType específico, ERROR
    if (!targetSong) {
      console.log(`❌ [LYRICS TEXT] No song found with voiceType: ${voiceType}`);
      console.log(`🚫 [LYRICS TEXT] REJECTED - Cannot create lyrics for non-existing song variant`);
      
      return res.status(404).json({ 
        message: `No se encontró ninguna canción con el tipo de voz ${voiceType}. Solo se pueden guardar letras para variantes de canciones que realmente existen.`,
        requestedVoiceType: voiceType,
        availableSong: song.title,
        error: 'SONG_VARIANT_NOT_EXISTS'
      });
    }
    
    // Usar la song encontrada
    targetSongId = targetSong.id;
    targetVoiceType = targetSong.voiceType;
    
    // Detectar si es texto simple o formato de sincronización
    const linesWithTime = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && /^\d/.test(trimmed) && trimmed.includes(':');
    });
    
    const isTextOnly = linesWithTime.length === 0;
    
    // Si es solo texto (no sincronización), crear una entrada de texto simple
    if (isTextOnly) {
      
      // Eliminar letras de texto existentes para este voiceType en la canción correcta
      await (prisma as any).lyric.deleteMany({
        where: {
          songId: targetSongId, // Usar el songId específico de la variante correcta
          voiceType: targetVoiceType, // Usar el voiceType correcto
          isTextLyrics: true
        }
      });
    
      // Crear nueva entrada de texto
      const lyric = await (prisma as any).lyric.create({
        data: {
          songId: targetSongId, // Guardar en la variante específica
          voiceType: targetVoiceType, // Especificar el tipo de voz
          content: text.trim(),
          textContent: text.trim(),
          startTime: 0,
          lineNumber: 1,
          isTextLyrics: true,
          isSynchronized: false, // Texto completo nunca está sincronizado
          createdBy: "cmf22p6ca0006eiugz77hj3dc" // Usuario admin por defecto
        }
      });
      
      return res.json({
        message: 'Letras guardadas como texto',
        lyric: {
          id: lyric.id,
          content: lyric.content,
          songId: lyric.songId,
          voiceType: lyric.voiceType,
          isTextLyrics: lyric.isTextLyrics
        }
      });
    }
    
    // Si tiene formato de tiempo, procesarlo como letras sincronizadas
    
    // Eliminar entradas existentes para esta canción y voiceType
    await (prisma as any).lyric.deleteMany({
      where: {
        songId: targetSongId, // Usar el songId específico de la variante correcta
        voiceType: targetVoiceType // Usar el voiceType correcto
      }
    });
    
    const lines = text.split('\n');
    const createdLyrics = [];
    let lineNumber = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Intentar extraer tiempo y texto
      const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        const startTime = minutes * 60 + seconds;
        const lyricsText = timeMatch[3].trim();
        
        const lyric = await (prisma as any).lyric.create({
          data: {
            songId: targetSongId, // Guardar en la variante específica
            voiceType: targetVoiceType, // Especificar el tipo de voz
            content: lyricsText,
            startTime: startTime,
            lineNumber: lineNumber,
            isTextLyrics: false,
            isSynchronized: startTime > 0, // Automático: true si startTime > 0
            createdBy: "cmf22p6ca0006eiugz77hj3dc" // Usuario admin por defecto
          }
        });
        
        createdLyrics.push(lyric);
        } else {
        // Si no tiene formato de tiempo, crear como texto simple con tiempo 0
        const lyric = await (prisma as any).lyric.create({
          data: {
            songId: targetSongId, // Guardar en la variante específica
            voiceType: targetVoiceType, // Especificar el tipo de voz
            content: trimmed,
            startTime: 0,
            lineNumber: lineNumber,
            isTextLyrics: false,
            isSynchronized: false, // Automático: false porque startTime = 0
            createdBy: "cmf22p6ca0006eiugz77hj3dc" // Usuario admin por defecto
          }
        });
        
        createdLyrics.push(lyric);
        }
      lineNumber++;
    }
    
    res.json({
      message: 'Letras guardadas exitosamente',
      lyricsCount: createdLyrics.length,
      songId: targetSongId,
      voiceType: targetVoiceType,
      lyrics: createdLyrics.map(l => ({
        id: l.id,
        content: l.content,
        startTime: l.startTime,
        voiceType: l.voiceType,
        isTextLyrics: l.isTextLyrics
      }))
    });
    
  } catch (error) {
    console.error('Error saving lyrics text:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
  }
});

// GET /api/lyrics/:songId/sync - Obtener letras sincronizadas
router.get('/:songId/sync', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { voiceType } = req.query;
    
    // Verificar que la canción existe
    const song = await (prisma as any).song.findUnique({
      where: { id: songId }
    });
    
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    
    // LÓGICA CORREGIDA: Solo buscar en songs que realmente existen
    let targetSongId = songId;
    let targetVoiceType = voiceType as string;
    
    if (voiceType) {
      
      let targetSong = null;
      
      // Caso 1: Si el song actual ya tiene el voiceType correcto
      if (song.voiceType === voiceType) {
        targetSong = song;
        } else {
        // Caso 2: Buscar en hermanos (songs con mismo padre o mismo parentSongId)
        const searchConditions = [];
        
        if (song.parentSongId) {
          // Si el song actual es una variante, buscar entre hermanos
          searchConditions.push({ parentSongId: song.parentSongId });
          // También incluir el padre
          searchConditions.push({ id: song.parentSongId });
        } else {
          // Si el song actual es padre, buscar entre sus variantes
          searchConditions.push({ parentSongId: song.id });
          // También incluir el mismo song padre por si tiene voiceType null
          searchConditions.push({ id: song.id });
        }
        
        if (searchConditions.length > 0) {
          targetSong = await (prisma as any).song.findFirst({
            where: {
              voiceType: voiceType,
              OR: searchConditions
            },
            select: {
              id: true,
              title: true,
              voiceType: true,
              parentSongId: true
            }
          });
          
          if (targetSong) {
            }
        }
      }
      
      if (targetSong) {
        targetSongId = targetSong.id;
        targetVoiceType = targetSong.voiceType;
      } else {
        // Mantener songId original pero buscar letras del voiceType especificado
        // Este caso debería retornar vacío si no hay letras
      }
    }
    
    // Buscar letras para la canción específica y tipo de voz
    const whereClause: any = {
      songId: targetSongId
    };
    
    if (targetVoiceType) {
      whereClause.voiceType = targetVoiceType;
    }
    
    const lyrics = await (prisma as any).lyric.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' }
    });
    
    if (lyrics.length > 0) {
      lyrics.forEach((lyric: any, index: number) => {
        });
    }
    
    res.json({
      lyrics: lyrics.map((lyric: any) => ({
        id: lyric.id,
        content: lyric.content, // Usar 'content' en lugar de 'text' para consistency con frontend
        startTime: lyric.startTime, // Usar 'startTime' en lugar de 'tiempo' 
        lineNumber: lyric.lineNumber,
        voiceType: lyric.voiceType,
        isTextLyrics: lyric.isTextLyrics,
        isSynchronized: lyric.isSynchronized || false, // Incluir el nuevo campo
        isHighlighted: lyric.isHighlighted || false // ¡Campo crítico para el styling!
      })),
      songId: targetSongId,
      originalSongId: songId,
      requestedVoiceType: targetVoiceType
    });
    
    } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/lyrics/:songId/files - Obtener archivos de letras
router.get('/:songId/files', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    
    const files = await (prisma as any).lyricsFile.findMany({
      where: { songId },
      orderBy: { createdAt: 'desc' }
    });
    
    const filesWithUrls = files.map((file: any) => ({
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
      url: `/api/lyrics/files/${file.id}`
    }));
    
    res.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Error fetching lyrics files:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/lyrics/:songId/files/:fileId - Eliminar archivo de letras
router.delete('/:songId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { songId, fileId } = req.params;
    
    const file = await (prisma as any).lyricsFile.findFirst({
      where: { 
        id: fileId,
        songId: songId
      }
    });
    
    if (!file) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    
    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads', file.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Eliminar registro de la base de datos
    await (prisma as any).lyricsFile.delete({
      where: { id: fileId }
    });
    
    res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting lyrics file:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/lyrics/:songId - Obtener información completa de letras de una canción
router.get('/:songId', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    
    // Buscar la canción con todas sus relaciones
    const song = await (prisma as any).song.findUnique({
      where: { id: songId },
      include: {
        lyrics: {
          orderBy: { lineNumber: 'asc' }
        },
        lyricsFiles: {
          orderBy: { createdAt: 'desc' }
        },
        parentSong: {
          include: {
            lyricsFiles: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });
    
    if (!song) {
      console.log(`❌ [LYRICS] Song not found: ${songId}`);
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    
    // Combinar archivos de letras (los archivos están en la canción padre)
    const allLyricsFiles = [
      ...(song.lyricsFiles || []),
      ...(song.parentSong?.lyricsFiles || [])
    ];
    
    // Respuesta en el formato esperado por el frontend
    const response = {
      success: true,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        voiceType: song.voiceType,
        parentSongId: song.parentSongId,
        hasLyricSync: song.hasLyricSync,
        lyrics: song.lyrics || [],
        lyricsFiles: allLyricsFiles
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching song lyrics:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/lyrics/:songId/sync - Actualizar sincronización de letras
router.put('/:songId/sync', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { syncData } = req.body;

    if (!syncData || !Array.isArray(syncData)) {
      return res.status(400).json({ message: 'Datos de sincronización inválidos' });
    }

    // Buscar la canción
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    // Obtener el voiceType de la primera entrada (todas deberían tener el mismo)
    const voiceType = syncData[0]?.voiceType || song.voiceType;
    
    // Borrar todas las letras sincronizadas existentes para esta canción y voiceType
    await prisma.lyric.deleteMany({
      where: {
        songId: songId,
        voiceType: voiceType
      }
    });

    // Crear las nuevas entradas de sincronización
    const createdLyrics = [];
    
    for (const [index, syncEntry] of syncData.entries()) {
      const lyric = await prisma.lyric.create({
        data: {
          songId: songId,
          content: syncEntry.content,
          startTime: syncEntry.startTime || 0,
          endTime: syncEntry.endTime || null,
          lineNumber: syncEntry.lineNumber || index,
          voiceType: voiceType,
          isSynchronized: (syncEntry.startTime || 0) > 0,
          isTextLyrics: true,
          createdBy: (req as any).user?.id || 'system' // Usar el ID del usuario autenticado
        }
      });
      
      createdLyrics.push(lyric);
      console.log(`📝 [LYRICS SYNC UPDATE] Created lyric line ${syncEntry.lineNumber}: "${syncEntry.content}" (${syncEntry.startTime || 0}s)`);
    }

    // Actualizar el estado hasLyricSync de la canción
    await prisma.song.update({
      where: { id: songId },
      data: { hasLyricSync: true }
    });

    res.json({
      success: true,
      message: 'Sincronización actualizada correctamente',
      lyrics: createdLyrics,
      count: createdLyrics.length
    });

  } catch (error) {
    console.error('Error updating lyrics sync:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/lyrics/:songId/sync-variants - Actualizar sincronización con auto-sincronización entre variantes
router.put('/:songId/sync-variants', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { syncData } = req.body;

    if (!syncData || !Array.isArray(syncData)) {
      return res.status(400).json({ message: 'Datos de sincronización inválidos' });
    }

    // Buscar la canción
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    // Obtener el voiceType de la primera entrada (todas deberían tener el mismo)
    const currentVoiceType = syncData[0]?.voiceType || song.voiceType;
    
    // Borrar todas las letras sincronizadas existentes para esta canción y voiceType
    await prisma.lyric.deleteMany({
      where: {
        songId: songId,
        voiceType: currentVoiceType
      }
    });

    // Crear las nuevas entradas de sincronización
    const createdLyrics = [];
    
    for (const [index, syncEntry] of syncData.entries()) {
      const lyric = await prisma.lyric.create({
        data: {
          songId: songId,
          content: syncEntry.content,
          startTime: syncEntry.startTime || 0,
          endTime: syncEntry.endTime || null,
          lineNumber: syncEntry.lineNumber || index,
          voiceType: currentVoiceType,
          isSynchronized: (syncEntry.startTime || 0) > 0,
          isTextLyrics: true,
          isActive: true, // Campo para estado general
          isHighlighted: syncEntry.isHighlighted === true, // Usar el valor exacto del frontend
          createdBy: (req as any).user?.id || 'system'
        }
      });
      
      createdLyrics.push(lyric);
      
      }

    // Actualizar el estado hasLyricSync de la canción
    await prisma.song.update({
      where: { id: songId },
      data: { hasLyricSync: true }
    });

    // NUEVA FUNCIONALIDAD: Buscar y sincronizar variantes no sincronizadas
    let variantsUpdated = 0;
    const updatedVariants: string[] = [];
    
    // Buscar todas las variantes relacionadas
    const searchConditions = [];
    
    if (song.parentSongId) {
      // Si es una variante, buscar hermanos
      searchConditions.push({ parentSongId: song.parentSongId });
      searchConditions.push({ id: song.parentSongId });
    } else {
      // Si es padre, buscar hijos
      searchConditions.push({ parentSongId: song.id });
    }

    if (searchConditions.length > 0) {
      const relatedSongs = await prisma.song.findMany({
        where: {
          OR: searchConditions,
          id: { not: songId }, // Excluir la canción actual
          voiceType: { not: null } // Solo variantes, no el padre
        },
        select: {
          id: true,
          title: true,
          voiceType: true
        }
      });

      for (const relatedSong of relatedSongs) {
        // Verificar si la variante tiene letras sincronizadas (línea > 0 con tiempos reales)
        const existingSync = await prisma.lyric.findFirst({
          where: {
            songId: relatedSong.id,
            voiceType: relatedSong.voiceType,
            lineNumber: { gt: 0 },
            OR: [
              { isSynchronized: true },
              { startTime: { gt: 0 } }
            ]
          }
        });

        if (!existingSync) {
          
          // Borrar letras existentes de esta variante
          await prisma.lyric.deleteMany({
            where: {
              songId: relatedSong.id,
              voiceType: relatedSong.voiceType
            }
          });

          // Crear nuevas letras para esta variante - COPIAR TIEMPOS PERO isHighlighted = false
          for (const [index, syncEntry] of syncData.entries()) {
            await prisma.lyric.create({
              data: {
                songId: relatedSong.id,
                content: syncEntry.content,
                startTime: syncEntry.startTime || 0, // Mantener los tiempos de sincronización
                endTime: syncEntry.endTime || null,
                lineNumber: syncEntry.lineNumber || index,
                voiceType: relatedSong.voiceType,
                isSynchronized: (syncEntry.startTime || 0) > 0, // Mantener sincronización
                isTextLyrics: true,
                isActive: true, // Por defecto todas las líneas activas para otras variantes
                isHighlighted: false, // FALSE para otras variantes - no participan por defecto
                createdBy: (req as any).user?.id || 'system'
              }
            });
          }

          // Actualizar el estado hasLyricSync de la variante
          await prisma.song.update({
            where: { id: relatedSong.id },
            data: { hasLyricSync: (syncData.some(s => (s.startTime || 0) > 0)) } // Tiene sync si hay tiempos reales
          });

          variantsUpdated++;
          updatedVariants.push(relatedSong.voiceType || 'Unknown');
          
        } else {
          console.log(`⏭️ [LYRICS SYNC VARIANTS] Skipping ${relatedSong.voiceType} - already has sync data`);
        }
      }
    }

    res.json({
      success: true,
      message: 'Sincronización actualizada correctamente',
      lyrics: createdLyrics,
      count: createdLyrics.length,
      variantsUpdated: variantsUpdated,
      updatedVariants: updatedVariants,
      autoSyncMessage: variantsUpdated > 0 ? `Se aplicó automáticamente la letra y sincronización a ${variantsUpdated} variante(s): ${updatedVariants.join(', ')}` : null
    });

  } catch (error) {
    console.error('Error updating lyrics sync with variants:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
