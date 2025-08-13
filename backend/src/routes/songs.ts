import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload, multiUpload, handleMulterError, renameUploadedFiles, cleanupFiles, cleanupFolder } from '../middleware/uploadImproved';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

const prisma = new PrismaClient();
const router = express.Router();

// Obtener IP local para acceso móvil
const getLocalIP = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const LOCAL_IP = getLocalIP();

// Subir canción individual
router.post('/upload', authenticateToken, upload.single('audio'), handleMulterError, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const { title, artist, album, genre, voiceType, parentSongId } = req.body;

    if (!title) {
      cleanupFiles([req.file]);
      return res.status(400).json({ message: 'Title is required' });
    }

    // Si es una versión por voz, verificar que existe la canción padre
    if (parentSongId) {
      const parentSong = await prisma.song.findUnique({
        where: { id: parentSongId, isActive: true }
      });

      if (!parentSong) {
        cleanupFiles([req.file]);
        if (req.songFolderPath) {
          cleanupFolder(req.songFolderPath);
        }
        return res.status(400).json({ message: 'Parent song not found' });
      }
    }

    // Crear registro en la base de datos con la nueva estructura de archivos
    const relativePath = path.relative(path.join(__dirname, '../../uploads'), req.file.path);
    
    const song = await prisma.song.create({
      data: {
        title: voiceType ? `${title} (${voiceType})` : title,
        artist: artist || null,
        album: album || null,
        genre: genre || null,
        fileName: req.file.filename,
        filePath: relativePath, // Guardar ruta relativa
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        voiceType: voiceType || null,
        parentSongId: parentSongId || null,
        uploadedBy: req.user!.id,
        folderName: req.songFolderName // Nuevo campo para la carpeta
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
    // Limpiar archivos en caso de error
    if (req.file) {
      cleanupFiles([req.file]);
    }
    if (req.songFolderPath) {
      cleanupFolder(req.songFolderPath);
    }
    console.error('Error uploading song:', error);
    res.status(500).json({ message: 'Failed to upload song' });
  }
});

// Subir múltiples canciones con asignación de voces
router.post('/multi-upload', 
  (req: any, res: any, next: any) => {
    console.log(`\n🎵 [MULTI-UPLOAD] === INICIO DEL PROCESO ===`);
    console.log(`🎵 [MULTI-UPLOAD] Step 1: Initial request received`);
    console.log(`   📊 Method: ${req.method}`);
    console.log(`   📊 URL: ${req.url}`);
    console.log(`   📊 Content-Type: ${req.headers['content-type']}`);
    console.log(`   📊 Content-Length: ${req.headers['content-length']}`);
    next();
  },
  (req: any, res: any, next: any) => {
    console.log(`🎵 [MULTI-UPLOAD] Step 2: Checking authentication...`);
    next();
  },
  authenticateToken,
  (req: any, res: any, next: any) => {
    console.log(`🎵 [MULTI-UPLOAD] Step 3: Authentication passed, processing files...`);
    next();
  },
  (req: any, res: any, next: any) => {
    console.log(`🎵 [MULTI-UPLOAD] Step 4: Before multer processing`);
    console.log(`   📋 Body before multer:`, typeof req.body, Object.keys(req.body || {}));
    console.log(`   📋 Files before multer:`, typeof (req as any).files);
    next();
  },
  multiUpload.array('audio', 10),
  (req: any, res: any, next: any) => {
    console.log(`🎵 [MULTI-UPLOAD] Step 5: After multer processing`);
    console.log(`   📋 Body after multer:`, typeof req.body, Object.keys(req.body || {}));
    console.log(`   📋 Files after multer:`, {
      type: typeof req.files,
      isArray: Array.isArray(req.files),
      length: req.files ? (req.files as any).length : 'undefined'
    });
    next();
  },
  handleMulterError,
  async (req: AuthRequest, res: Response) => {
    console.log(`🎵 [MULTI-UPLOAD] Step 6: Main handler started`);
    
    try {
      console.log(`🎵 [MULTI-UPLOAD] Step 7: Processing request data`);
      
      const files = req.files as Express.Multer.File[];
      
      console.log(`📁 [FILES] Complete analysis:`, {
        reqFiles: req.files,
        filesType: typeof req.files,
        filesArray: Array.isArray(files),
        filesLength: files ? files.length : 'undefined',
        filesContent: files ? files.map(f => ({ name: f.originalname, size: f.size, path: f.path })) : 'no files'
      });
      
      console.log(`📋 [BODY] Complete body analysis:`, {
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {}),
        bodyContent: req.body
      });
      
      if (!files || files.length === 0) {
        console.log(`❌ [MULTI-UPLOAD] FATAL: No files found in request`);
        console.log(`   🔍 Debug info:`, {
          reqFiles: req.files,
          reqFilesKeys: req.files ? Object.keys(req.files) : 'no files object',
          reqBody: req.body,
          reqBodyKeys: req.body ? Object.keys(req.body) : 'no body'
        });
        return res.status(400).json({ 
          message: 'No audio files provided',
          debug: {
            files: req.files,
            body: req.body,
            step: 'file_validation'
          }
        });
      }

      console.log(`✅ [MULTI-UPLOAD] Files validated: ${files.length} files`);

      const { title, artist, album, genre, voiceAssignments } = req.body;

      console.log(`📝 [METADATA] Extracted data:`, {
        title: title,
        artist: artist,
        album: album,
        genre: genre,
        voiceAssignmentsType: typeof voiceAssignments,
        voiceAssignmentsRaw: voiceAssignments
      });

      if (!title) {
        console.log(`❌ [MULTI-UPLOAD] Missing title`);
        cleanupFiles(files);
        if (req.songFolderPath) {
          cleanupFolder(req.songFolderPath);
        }
        return res.status(400).json({ message: 'Title is required' });
      }

      console.log(`🎵 [MULTI-UPLOAD] Step 8: Parsing voice assignments`);

      // Parsear asignaciones de voz
      let parsedAssignments;
      try {
        parsedAssignments = typeof voiceAssignments === 'string' 
          ? JSON.parse(voiceAssignments) 
          : voiceAssignments;
        
        console.log(`✅ [VOICE-ASSIGNMENTS] Parsed successfully:`, parsedAssignments);
      } catch (error) {
        console.log(`❌ [VOICE-ASSIGNMENTS] Parse error:`, error);
        cleanupFiles(files);
        if (req.songFolderPath) {
          cleanupFolder(req.songFolderPath);
        }
        return res.status(400).json({ message: 'Invalid voice assignments format' });
      }

    // Validar que todos los archivos tienen asignación de voz
    const missingAssignments = files.filter(file => 
      !parsedAssignments.find((assignment: any) => 
        assignment.filename === file.originalname && assignment.voiceType
      )
    );

    if (missingAssignments.length > 0) {
      cleanupFiles(files);
      if (req.songFolderPath) {
        cleanupFolder(req.songFolderPath);
      }
      return res.status(400).json({ 
        message: `Missing voice type assignments for: ${missingAssignments.map(f => f.originalname).join(', ')}` 
      });
    }

    console.log(`🎵 [MULTI-UPLOAD] Step 9: Creating folder and renaming files`);
    
    // Crear carpeta específica para esta canción
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\-_.]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '');
    const folderName = `${normalizedTitle}_${Date.now()}`;
    
    console.log(`📁 [FOLDER] Creating folder: ${folderName}`);
    
    // Renombrar archivos según tipo de voz y moverlos a su carpeta
    const renamedFiles = await renameUploadedFiles(files, title, undefined, folderName, parsedAssignments);

    console.log(`📁 [FILES] Files renamed and moved to folder:`, {
      folderName: folderName,
      filesCount: renamedFiles.length,
      files: renamedFiles.map(f => ({ fileName: f.fileName, folderName: f.folderName }))
    });

    // Crear canciones en la base de datos
    const songs: any[] = [];
    
    for (let i = 0; i < renamedFiles.length; i++) {
      const renamedFile = renamedFiles[i];
      const originalFile = files[i];
      const assignment = parsedAssignments.find((a: any) => a.filename === originalFile.originalname);
      
      if (!assignment) {
        console.log('⚠️ No assignment found for file:', originalFile.originalname);
        continue;
      }

      const relativePath = path.relative(path.join(__dirname, '../../uploads'), renamedFile.filePath);
      
      console.log('💾 Creating song in database:', {
        title: `${title} (${assignment.voiceType})`,
        fileName: renamedFile.fileName,
        voiceType: assignment.voiceType
      });
      
      const song = await prisma.song.create({
        data: {
          title: `${title} (${assignment.voiceType})`,
          artist: artist || null,
          album: album || null,
          genre: genre || null,
          fileName: renamedFile.fileName,
          filePath: relativePath,
          fileSize: originalFile.size,
          mimeType: originalFile.mimetype,
          voiceType: assignment.voiceType,
          uploadedBy: req.user!.id,
          folderName: renamedFile.folderName || req.songFolderName
        },
        include: {
          uploader: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      songs.push(song);
    }

    res.status(201).json({
      message: `Successfully uploaded ${songs.length} songs`,
      songs
    });

  } catch (error) {
    // Limpiar archivos en caso de error
    if (req.files) {
      cleanupFiles(req.files as Express.Multer.File[]);
    }
    if (req.songFolderPath) {
      cleanupFolder(req.songFolderPath);
    }
    console.error('Error in multi-upload:', error);
    res.status(500).json({ message: 'Failed to upload songs' });
  }
});

// Obtener todas las canciones
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  console.log(`🎵 [GET-SONGS] Request received:`, {
    includeVersions: req.query.includeVersions,
    user: req.user?.email
  });
  
  try {
    const { includeVersions = 'true' } = req.query;
    
    console.log(`🔍 [GET-SONGS] Querying database with filters:`, {
      isActive: true,
      parentSongId: includeVersions === 'false' ? null : 'any'
    });
    
    const songs = await prisma.song.findMany({
      where: {
        isActive: true,
        ...(includeVersions === 'false' ? { parentSongId: null } : {})
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ [GET-SONGS] Database query successful:`, {
      totalSongs: songs.length,
      songsWithVersions: songs.filter((s: any) => s.childVersions.length > 0).length
    });

    res.json({ songs });
  } catch (error: any) {
    console.error(`❌ [GET-SONGS] Error fetching songs:`, {
      error: error?.message,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 3)
    });
    
    // Devolver un array vacío en lugar de error si es un problema de base de datos vacía
    if (error?.code === 'P2025' || error?.code === 'P2021') {
      console.log(`📝 [GET-SONGS] Database empty, returning empty array`);
      return res.json({ songs: [] });
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch songs',
      debug: {
        error: error?.message,
        code: error?.code
      }
    });
  }
});

// Obtener canción por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const song = await prisma.song.findUnique({
      where: {
        id,
        isActive: true
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
        }
      }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.json({ song });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ message: 'Failed to fetch song' });
  }
});

// Servir archivos de audio con soporte para IP local
router.get('/file/:folderName/:fileName', async (req, res) => {
  console.log(`\n🎵 [FILE-SERVER] === AUDIO FILE REQUEST ===`);
  console.log(`🎵 [FILE-SERVER] Request received:`, {
    method: req.method,
    url: req.url,
    params: req.params,
    headers: {
      'user-agent': req.headers['user-agent'],
      'range': req.headers.range,
      'accept': req.headers.accept,
      'referer': req.headers.referer
    }
  });
  
  try {
    const { folderName, fileName } = req.params;
    
    console.log(`📁 [FILE-SERVER] Looking for file:`, {
      folderName,
      fileName,
      expectedPath: `uploads/songs/${folderName}/${fileName}`
    });
    
    const filePath = path.join(__dirname, '../../uploads/songs', folderName, fileName);
    
    console.log(`📂 [FILE-SERVER] Full file path:`, {
      fullPath: filePath,
      exists: fs.existsSync(filePath)
    });
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ [FILE-SERVER] File not found:`, filePath);
      
      // Intentar buscar en la carpeta raíz como fallback
      const fallbackPath = path.join(__dirname, '../../uploads/songs', fileName);
      console.log(`🔄 [FILE-SERVER] Trying fallback path:`, {
        fallbackPath,
        exists: fs.existsSync(fallbackPath)
      });
      
      if (fs.existsSync(fallbackPath)) {
        console.log(`✅ [FILE-SERVER] Found file in root folder, redirecting...`);
        return res.redirect(`/api/songs/file-root/${fileName}`);
      }
      
      return res.status(404).json({ message: 'File not found' });
    }

    // Configurar headers para audio streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log(`📊 [FILE-SERVER] File info:`, {
      size: fileSize,
      hasRange: !!range,
      rangeHeader: range
    });

    if (range) {
      console.log(`🎯 [FILE-SERVER] Handling range request:`, range);
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      
      console.log(`📏 [FILE-SERVER] Range details:`, {
        start,
        end,
        chunksize,
        totalSize: fileSize
      });
      
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'range'
      };
      
      console.log(`📤 [FILE-SERVER] Sending partial content (206):`, head);
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      console.log(`📤 [FILE-SERVER] Sending full file (200)`);
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      };
      
      console.log(`📤 [FILE-SERVER] Headers:`, head);
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
    
    console.log(`✅ [FILE-SERVER] File served successfully`);
  } catch (error: any) {
    console.error(`❌ [FILE-SERVER] Error serving audio file:`, {
      error: error?.message,
      stack: error?.stack,
      params: req.params
    });
    res.status(500).json({ message: 'Error serving file' });
  }
});

// Endpoint fallback para archivos en la carpeta raíz
router.get('/file-root/:fileName', async (req, res) => {
  console.log(`\n🎵 [FILE-ROOT] === ROOT FILE REQUEST ===`);
  console.log(`🎵 [FILE-ROOT] Request received:`, {
    method: req.method,
    url: req.url,
    params: req.params,
    headers: {
      'user-agent': req.headers['user-agent'],
      'range': req.headers.range,
      'accept': req.headers.accept,
      'referer': req.headers.referer
    }
  });
  
  try {
    const { fileName } = req.params;
    
    console.log(`📁 [FILE-ROOT] Looking for file:`, {
      fileName,
      expectedPath: `uploads/songs/${fileName}`
    });
    
    const filePath = path.join(__dirname, '../../uploads/songs', fileName);
    
    console.log(`📂 [FILE-ROOT] Full file path:`, {
      fullPath: filePath,
      exists: fs.existsSync(filePath)
    });
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ [FILE-ROOT] File not found:`, filePath);
      return res.status(404).json({ message: 'File not found in root folder' });
    }

    // Configurar headers para audio streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log(`📊 [FILE-ROOT] File info:`, {
      size: fileSize,
      hasRange: !!range,
      rangeHeader: range
    });

    if (range) {
      console.log(`🎯 [FILE-ROOT] Handling range request:`, range);
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      
      console.log(`📏 [FILE-ROOT] Range details:`, {
        start,
        end,
        chunksize,
        totalSize: fileSize
      });
      
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'range'
      };
      
      console.log(`📤 [FILE-ROOT] Sending partial content (206):`, head);
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      console.log(`📤 [FILE-ROOT] Sending full file (200)`);
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      };
      
      console.log(`📤 [FILE-ROOT] Headers:`, head);
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
    
    console.log(`✅ [FILE-ROOT] File served successfully`);
  } catch (error: any) {
    console.error(`❌ [FILE-ROOT] Error serving audio file:`, {
      error: error?.message,
      stack: error?.stack,
      params: req.params
    });
    res.status(500).json({ message: 'Error serving file' });
  }
});

// Eliminar canción
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const song = await prisma.song.findUnique({
      where: { id, isActive: true }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Solo el admin, director o el usuario que subió la canción pueden eliminarla
    if (userRole !== 'ADMIN' && userRole !== 'DIRECTOR' && song.uploadedBy !== userId) {
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

// Obtener información del servidor para acceso móvil
router.get('/info/server', (req, res) => {
  res.json({
    localIP: LOCAL_IP,
    port: process.env.PORT || 3001,
    audioBaseUrl: `http://${LOCAL_IP}:${process.env.PORT || 3001}/api/songs/file`
  });
});

export default router;
