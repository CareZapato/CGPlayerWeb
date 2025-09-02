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
    
    console.log('📄 [LYRICS FILE] Looking for file:', {
      fileId,
      fileName: lyricsFile.fileName,
      storedPath: lyricsFile.filePath,
      fullPath: filePath,
      exists: fs.existsSync(filePath)
    });
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ [LYRICS FILE] File not found at path:', filePath);
      return res.status(404).json({ message: 'Archivo físico no encontrado' });
    }
    
    // Establecer headers apropiados
    res.setHeader('Content-Type', lyricsFile.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${lyricsFile.fileName}"`);
    
    console.log('✅ [LYRICS FILE] Serving file successfully');
    
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
    
    console.log('✅ [LYRICS UPLOAD] File uploaded successfully:', {
      songId,
      fileName: file.originalname,
      fileId: lyricsFile.id,
      path: lyricsFile.filePath
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
    
    console.log(`🎵 [LYRICS TEXT] Starting lyrics save process for song: ${songId}, voiceType: ${voiceType}`);
    
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
    
    console.log(`📊 [LYRICS TEXT] Found song: ${song.title} (id: ${song.id}, voiceType: ${song.voiceType})`);
    
    // LÓGICA CRUCIAL: Determinar el songId correcto para guardar las letras
    let targetSongId = songId;
    const targetVoiceType = voiceType;
    
    // Si la canción actual es un padre (voiceType = null), necesitamos encontrar la variante específica
    if (!song.voiceType) {
      console.log(`🔍 [LYRICS TEXT] Song is parent, searching for ${targetVoiceType} variant...`);
      
      // Buscar todas las variantes de esta canción padre
      const allVariants = await (prisma as any).song.findMany({
        where: {
          OR: [
            { parentSongId: songId },
            { id: songId }
          ]
        },
        select: {
          id: true,
          title: true,
          voiceType: true,
          parentSongId: true
        }
      });
      
      console.log(`📋 [LYRICS TEXT] Found ${allVariants.length} total songs (including parent):`);
      allVariants.forEach(variant => {
        console.log(`  - ${variant.title} (${variant.id}) - voiceType: ${variant.voiceType || 'NULL'} - parent: ${variant.parentSongId || 'NO'}`);
      });
      
      // Buscar la variante específica que corresponde al voiceType
      const targetVariant = allVariants.find(variant => variant.voiceType === targetVoiceType);
      
      if (targetVariant) {
        targetSongId = targetVariant.id;
        console.log(`✅ [LYRICS TEXT] Found exact match - ${targetVoiceType} variant: ${targetVariant.title} (${targetVariant.id})`);
      } else {
        console.log(`⚠️ [LYRICS TEXT] No exact ${targetVoiceType} variant found in ${allVariants.length} variants`);
        console.log(`⚠️ [LYRICS TEXT] Available voice types: ${allVariants.map(v => v.voiceType || 'NULL').join(', ')}`);
        return res.status(404).json({ 
          message: `No se encontró variante para el tipo de voz ${targetVoiceType}`,
          availableVoiceTypes: allVariants.map(v => v.voiceType).filter(Boolean)
        });
      }
    } else {
      console.log(`📝 [LYRICS TEXT] Song already has voiceType: ${song.voiceType}, using current songId: ${songId}`);
    }
    
    console.log(`📝 [LYRICS TEXT] FINAL TARGET: songId=${targetSongId}, voiceType=${targetVoiceType}`);
    
    // Detectar si es texto simple o formato de sincronización
    const linesWithTime = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && /^\d/.test(trimmed) && trimmed.includes(':');
    });
    
    const isTextOnly = linesWithTime.length === 0;
    
    console.log(`📋 [LYRICS TEXT] Content analysis: ${linesWithTime.length} lines with timing, isTextOnly: ${isTextOnly}`);
    
    // Si es solo texto (no sincronización), crear una entrada de texto simple
    if (isTextOnly) {
      console.log(`🎵 [LYRICS TEXT] Creating text-only lyrics for song ${targetSongId}`);
      
      // Eliminar letras de texto existentes para este voiceType en la canción correcta
      await (prisma as any).lyric.deleteMany({
        where: {
          songId: targetSongId, // Usar el songId específico de la variante correcta
          voiceType: targetVoiceType, // Usar el voiceType correcto
          isTextLyrics: true
        }
      });
      
      console.log(`🗑️ [LYRICS TEXT] Deleted existing text lyrics for songId: ${targetSongId}, voiceType: ${targetVoiceType}`);
      
      // Crear nueva entrada de texto
      const lyric = await (prisma as any).lyric.create({
        data: {
          songId: targetSongId, // Guardar en la variante específica
          voiceType: targetVoiceType, // Especificar el tipo de voz
          text: text.trim(),
          tiempo: 0,
          isTextLyrics: true
        }
      });
      
      console.log(`✅ [LYRICS TEXT] Created text lyrics: ${lyric.id} for songId: ${targetSongId}, voiceType: ${targetVoiceType}`);
      
      return res.json({
        message: 'Letras guardadas como texto',
        lyric: {
          id: lyric.id,
          text: lyric.text,
          songId: lyric.songId,
          voiceType: lyric.voiceType,
          isTextLyrics: lyric.isTextLyrics
        }
      });
    }
    
    // Si tiene formato de tiempo, procesarlo como letras sincronizadas
    console.log(`🎵 [LYRICS TEXT] Creating sync entries for song ${targetSongId}`);
    
    // Eliminar entradas existentes para esta canción y voiceType
    await (prisma as any).lyric.deleteMany({
      where: {
        songId: targetSongId, // Usar el songId específico de la variante correcta
        voiceType: targetVoiceType // Usar el voiceType correcto
      }
    });
    
    console.log(`🗑️ [LYRICS TEXT] Deleted existing sync lyrics for songId: ${targetSongId}, voiceType: ${targetVoiceType}`);
    
    const lines = text.split('\n');
    const createdLyrics = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Intentar extraer tiempo y texto
      const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        const tiempo = minutes * 60 + seconds;
        const lyricsText = timeMatch[3].trim();
        
        const lyric = await (prisma as any).lyric.create({
          data: {
            songId: targetSongId, // Guardar en la variante específica
            voiceType: targetVoiceType, // Especificar el tipo de voz
            text: lyricsText,
            tiempo: tiempo,
            isTextLyrics: false
          }
        });
        
        createdLyrics.push(lyric);
        console.log(`📝 [LYRICS TEXT] Created sync lyric: "${lyricsText}" at ${tiempo}s for songId: ${targetSongId}, voiceType: ${targetVoiceType}`);
      } else {
        // Si no tiene formato de tiempo, crear como texto simple con tiempo 0
        const lyric = await (prisma as any).lyric.create({
          data: {
            songId: targetSongId, // Guardar en la variante específica
            voiceType: targetVoiceType, // Especificar el tipo de voz
            text: trimmed,
            tiempo: 0,
            isTextLyrics: false
          }
        });
        
        createdLyrics.push(lyric);
        console.log(`📝 [LYRICS TEXT] Created text lyric without timing: "${trimmed}" for songId: ${targetSongId}, voiceType: ${targetVoiceType}`);
      }
    }
    
    console.log(`✅ [LYRICS TEXT] Successfully created ${createdLyrics.length} lyrics entries for songId: ${targetSongId}, voiceType: ${targetVoiceType}`);
    
    res.json({
      message: 'Letras guardadas exitosamente',
      lyricsCount: createdLyrics.length,
      songId: targetSongId,
      voiceType: targetVoiceType,
      lyrics: createdLyrics.map(l => ({
        id: l.id,
        text: l.text,
        tiempo: l.tiempo,
        voiceType: l.voiceType,
        isTextLyrics: l.isTextLyrics
      }))
    });
    
  } catch (error) {
    console.error('Error saving lyrics text:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// GET /api/lyrics/:songId/sync - Obtener letras sincronizadas
router.get('/:songId/sync', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const { voiceType } = req.query;
    
    console.log(`🎵 [LYRICS SYNC] Requesting lyrics for songId: ${songId}, voiceType: ${voiceType}`);
    
    // Verificar que la canción existe
    const song = await (prisma as any).song.findUnique({
      where: { id: songId }
    });
    
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    
    console.log(`📊 [LYRICS SYNC] Found song: ${song.title} (id: ${song.id}, voiceType: ${song.voiceType})`);
    
    // LÓGICA CRUCIAL: Determinar desde qué songId buscar las letras
    let targetSongId = songId;
    const targetVoiceType = voiceType;
    
    // Si la canción actual es un padre (voiceType = null) y se especifica un voiceType,
    // necesitamos encontrar la variante específica
    if (!song.voiceType && voiceType) {
      console.log(`🔍 [LYRICS SYNC] Song is parent, searching for ${targetVoiceType} variant...`);
      
      // Buscar todas las variantes de esta canción padre
      const allVariants = await (prisma as any).song.findMany({
        where: {
          OR: [
            { parentSongId: songId },
            { id: songId }
          ]
        },
        select: {
          id: true,
          title: true,
          voiceType: true,
          parentSongId: true
        }
      });
      
      console.log(`📋 [LYRICS SYNC] Found ${allVariants.length} total songs (including parent):`);
      allVariants.forEach(variant => {
        console.log(`  - ${variant.title} (${variant.id}) - voiceType: ${variant.voiceType || 'NULL'} - parent: ${variant.parentSongId || 'NO'}`);
      });
      
      // Buscar la variante específica que corresponde al voiceType
      const targetVariant = allVariants.find(variant => variant.voiceType === targetVoiceType);
      
      if (targetVariant) {
        targetSongId = targetVariant.id;
        console.log(`✅ [LYRICS SYNC] Found exact match - ${targetVoiceType} variant: ${targetVariant.title} (${targetVariant.id})`);
      } else {
        console.log(`⚠️ [LYRICS SYNC] No exact ${targetVoiceType} variant found`);
        // No retornar error, buscar en el song original
      }
    }
    
    console.log(`📝 [LYRICS SYNC] SEARCHING IN: songId=${targetSongId}, voiceType=${targetVoiceType}`);
    
    // Buscar letras para la canción específica y tipo de voz
    const whereClause: any = {
      songId: targetSongId
    };
    
    if (targetVoiceType) {
      whereClause.voiceType = targetVoiceType;
    }
    
    const lyrics = await (prisma as any).lyric.findMany({
      where: whereClause,
      orderBy: { tiempo: 'asc' }
    });
    
    console.log(`📋 [LYRICS SYNC] Found ${lyrics.length} lyrics entries`);
    
    if (lyrics.length > 0) {
      lyrics.forEach((lyric, index) => {
        console.log(`  [${index + 1}] "${lyric.text}" (tiempo: ${lyric.tiempo}s, voiceType: ${lyric.voiceType}, isText: ${lyric.isTextLyrics})`);
      });
    }
    
    res.json({
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        tiempo: lyric.tiempo,
        voiceType: lyric.voiceType,
        isTextLyrics: lyric.isTextLyrics
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
    
    const filesWithUrls = files.map(file => ({
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

export default router;
