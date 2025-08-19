import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload, multiUpload, handleMulterError, renameUploadedFiles, cleanupFiles, cleanupFolder } from '../middleware/uploadImproved';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

const prisma = new PrismaClient();
const router = express.Router();

// Log para verificar que el router se está cargando
console.log('🎵 [SONGS ROUTER] Loading songsImproved router...');

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

/**
 * @swagger
 * /songs/upload:
 *   post:
 *     summary: Subir una canción individual
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *               - title
 *               - artist
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de audio
 *               title:
 *                 type: string
 *                 description: Título de la canción
 *               artist:
 *                 type: string
 *                 description: Artista de la canción
 *               voiceTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [SOPRANO, MEZZOSOPRANO, ALTO, TENOR, BARITONO, BAJO, CORO, ORIGINAL]
 *                 description: Tipos de voz para la canción
 *     responses:
 *       201:
 *         description: Canción subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 song:
 *                   $ref: '#/components/schemas/Song'
 *       400:
 *         description: Error de validación o archivo faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

    // Renombrar el archivo usando la función de renombrado con carpeta
    const renamedFiles = await renameUploadedFiles([req.file], title, voiceType, req.songFolderName);
    const renamedFile = renamedFiles[0];

    // Crear registro en la base de datos con la nueva estructura de archivos
    const relativePath = path.relative(path.join(__dirname, '../../uploads'), renamedFile.filePath);
    
    const song = await prisma.song.create({
      data: {
        title: voiceType ? `${title} (${voiceType})` : title,
        artist: artist || null,
        album: album || null,
        genre: genre || null,
        fileName: renamedFile.fileName,
        filePath: relativePath, // Guardar ruta relativa
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        voiceType: voiceType || null,
        parentSongId: parentSongId || null,
        uploadedBy: req.user!.id,
        folderName: renamedFile.folderName // Usar el nombre de carpeta del archivo renombrado
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
router.post('/multi-upload', authenticateToken, multiUpload.array('audio', 10), handleMulterError, async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No audio files provided' });
    }

    const { title, artist, album, genre, voiceAssignments } = req.body;

    if (!title) {
      cleanupFiles(files);
      if (req.songFolderPath) {
        cleanupFolder(req.songFolderPath);
      }
      return res.status(400).json({ message: 'Title is required' });
    }

    // Parsear asignaciones de voz
    let parsedAssignments;
    try {
      parsedAssignments = typeof voiceAssignments === 'string' 
        ? JSON.parse(voiceAssignments) 
        : voiceAssignments;
    } catch (error) {
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

    // Renombrar archivos según tipo de voz
    const renamedFiles = await renameUploadedFiles(files, title, undefined, req.songFolderName, parsedAssignments);

    // Crear canción padre primero (sin tipo de voz específico)
    const parentSong = await prisma.song.create({
      data: {
        title: title, // Título sin tipo de voz
        artist: artist || null,
        album: album || null,
        genre: genre || null,
        fileName: renamedFiles[0].fileName, // Usar el primer archivo como referencia
        filePath: `songs/${req.songFolderName}`, // Ruta a la carpeta
        fileSize: files.reduce((total, file) => total + file.size, 0), // Suma de todos los archivos
        mimeType: 'multitrack/folder', // Indicar que es un contenedor
        voiceType: null, // Sin tipo de voz específico
        uploadedBy: req.user!.id,
        folderName: req.songFolderName,
        parentSongId: null // Es la canción padre
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

    // Crear canciones hijas vinculadas al padre
    const songs = [];
    
    for (let i = 0; i < renamedFiles.length; i++) {
      const file = renamedFiles[i];
      const originalFile = files[i];
      const assignment = parsedAssignments.find((a: any) => a.filename === originalFile.originalname);
      const relativePath = path.relative(path.join(__dirname, '../../uploads'), file.filePath);
      
      const song = await prisma.song.create({
        data: {
          title: `${title} (${assignment.voiceType})`,
          artist: artist || null,
          album: album || null,
          genre: genre || null,
          fileName: file.fileName,
          filePath: relativePath,
          fileSize: originalFile.size,
          mimeType: originalFile.mimetype,
          voiceType: assignment.voiceType,
          uploadedBy: req.user!.id,
          folderName: file.folderName,
          parentSongId: parentSong.id // Vincular al padre
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
      
      songs.push(song);
    }

    res.status(201).json({
      message: `Successfully uploaded 1 song with ${songs.length} voice variations`,
      parentSong,
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

/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Obtener todas las canciones
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: includeVersions
 *         in: query
 *         description: Incluir versiones de canciones
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: 'true'
 *     responses:
 *       200:
 *         description: Lista de canciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Song'
 *                   - type: object
 *                     properties:
 *                       uploader:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                       versions:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Song'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Obtener todas las canciones
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { includeVersions = 'true' } = req.query;
    const userId = req.user!.id;
    const userRoles = req.user!.roles || [];
    const userVoiceProfiles = req.user!.voiceProfiles || [];
    
    // Verificar si el usuario es ADMIN o DIRECTOR
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    console.log('🎵 [SONGS] User:', userId, 'Roles:', userRoles);
    console.log('🎵 [SONGS] Voice Profiles:', userVoiceProfiles.map((vp: any) => vp.voiceType));

    let whereClause: any = {
      isActive: true,
      ...(includeVersions === 'false' ? { parentSongId: null } : {})
    };

    // Si es CANTANTE, filtrar por tipos de voz del usuario (incluir CORO y ORIGINAL)
    if (isCantante && !isAdmin && !isDirector) {
      if (userVoiceProfiles.length > 0) {
        const userVoiceTypes = userVoiceProfiles.map((profile: any) => profile.voiceType);
        
        // Agregar CORO y ORIGINAL - todos pueden verlos
        const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
        
        console.log('🎵 [SONGS] Filtering by voice types:', allowedVoiceTypes);
        
        // Solo mostrar canciones que:
        // 1. Tienen parentId (son variaciones) Y tienen voiceType permitido
        // 2. O son canciones sin parentId pero sin voiceType (contenedoras generales)
        whereClause = {
          ...whereClause,
          OR: [
            {
              parentSongId: { not: null },
              voiceType: { in: allowedVoiceTypes }
            },
            {
              parentSongId: null,
              voiceType: null
            }
          ]
        };
      } else {
        // Si no tiene tipos de voz asignados, solo mostrar CORO y ORIGINAL
        console.log('🎵 [SONGS] No voice profiles, only showing CORO and ORIGINAL');
        whereClause = {
          ...whereClause,
          OR: [
            {
              parentSongId: { not: null },
              voiceType: { in: ['CORO', 'ORIGINAL'] }
            },
            {
              parentSongId: null,
              voiceType: null
            }
          ]
        };
      }
    } else {
      console.log('🎵 [SONGS] User is ADMIN/DIRECTOR, showing all songs');
    }
    
    const songs = await prisma.song.findMany({
      where: whereClause,
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

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ message: 'Failed to fetch songs' });
  }
});

// Obtener canciones para playlists (filtradas por tipo de voz del usuario)
router.get('/for-playlist', authenticateToken, async (req: AuthRequest, res: Response) => {
  console.log('🎵 [FOR-PLAYLIST] Endpoint called!');
  try {
    const userId = req.user!.id;
    const userRoles = req.user!.roles || [];
    const userVoiceProfiles = req.user!.voiceProfiles || [];
    const { search = '' } = req.query;
    
    console.log('🎵 [FOR-PLAYLIST] User:', userId, 'Roles:', userRoles, 'Search:', search);
    console.log('🎵 [FOR-PLAYLIST] Voice Profiles:', userVoiceProfiles.map((vp: any) => vp.voiceType));
    
    // Verificar si el usuario es ADMIN o DIRECTOR
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    let whereClause: any = {
      isActive: true,
      parentSongId: { not: null }, // Solo variaciones (canciones con parentId)
      voiceType: { not: null } // Y que tengan voiceType definido
    };

    // Agregar búsqueda simple pero efectiva
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = search.trim();
      whereClause.title = {
        contains: searchTerm,
        mode: 'insensitive'
      };
    }

    // Si es CANTANTE (y no es ADMIN ni DIRECTOR), filtrar por tipos de voz del usuario
    if (isCantante && !isAdmin && !isDirector) {
      if (userVoiceProfiles.length === 0) {
        // Si no tiene tipos asignados, solo mostrar CORO y ORIGINAL
        whereClause.voiceType = { in: ['CORO', 'ORIGINAL'] };
        console.log('🎵 [FOR-PLAYLIST] No voice profiles found, only showing CORO and ORIGINAL');
      } else {
        // Extraer los tipos de voz del usuario y agregar CORO y ORIGINAL
        const userVoiceTypes = userVoiceProfiles.map((profile: any) => profile.voiceType);
        const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
        whereClause.voiceType = { in: allowedVoiceTypes };
        console.log('🎵 [FOR-PLAYLIST] Filtering by voice types:', allowedVoiceTypes);
      }
    } else {
      console.log('🎵 [FOR-PLAYLIST] User is ADMIN/DIRECTOR, showing all songs');
    }

    // Obtener canciones compatibles
    const songs = await prisma.song.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        artist: true,
        duration: true,
        voiceType: true,
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
    res.status(500).json({ message: 'Error interno del servidor' });
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

// Obtener las variaciones de voz de una canción
router.get('/:id/versions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRoles = req.user!.roles || [];
    
    // Determinar los tipos de voz permitidos según el rol del usuario
    let allowedVoiceTypes: ('SOPRANO' | 'CONTRALTO' | 'TENOR' | 'BAJO' | 'CORO' | 'ORIGINAL')[] = [];
    
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    if (isAdmin || isDirector) {
      // ADMIN y DIRECTOR pueden ver todas las variaciones
      allowedVoiceTypes = ['SOPRANO', 'CONTRALTO', 'TENOR', 'BAJO', 'CORO', 'ORIGINAL'];
    } else if (isCantante) {
      // CANTANTE solo puede ver sus tipos de voz + CORO + ORIGINAL
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { voiceProfiles: true }
      });
      
      if (user?.voiceProfiles) {
        const userVoiceTypes = user.voiceProfiles.map(vp => vp.voiceType as any);
        allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
        console.log(`🎵 [VERSIONS] User: ${userId} Voice Profiles: [`, userVoiceTypes.map(vt => `'${vt}'`).join(', '), ']');
        console.log(`🎵 [VERSIONS] Filtering by voice types: [`, allowedVoiceTypes.map(vt => `'${vt}'`).join(', '), ']');
      } else {
        allowedVoiceTypes = ['CORO', 'ORIGINAL']; // Solo CORO y ORIGINAL por defecto
      }
    }
    
    // Buscar la canción contenedora
    const containerSong = await prisma.song.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        genre: true,
        duration: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        folderName: true,
        voiceType: true,
        parentSongId: true,
        coverColor: true,
        uploadedBy: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        childVersions: {
          where: {
            voiceType: {
              in: allowedVoiceTypes
            }
          },
          select: {
            id: true,
            title: true,
            artist: true,
            album: true,
            genre: true,
            duration: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            folderName: true,
            voiceType: true,
            parentSongId: true,
            coverColor: true,
            uploadedBy: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
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

    if (!containerSong) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    // Si es una canción contenedora, devolver sus variaciones filtradas
    if (containerSong.childVersions && containerSong.childVersions.length > 0) {
      res.json({ 
        versions: containerSong.childVersions,
        total: containerSong.childVersions.length
      });
    } else {
      // Si no es contenedora, verificar si la canción individual está permitida
      const isAllowed = containerSong.voiceType ? allowedVoiceTypes.includes(containerSong.voiceType as any) : true;
      if (isAllowed) {
        res.json({ 
          versions: [containerSong],
          total: 1
        });
      } else {
        res.json({ 
          versions: [],
          total: 0
        });
      }
    }
  } catch (error) {
    console.error('Error fetching song versions:', error);
    res.status(500).json({ message: 'Failed to fetch song versions' });
  }
});

// Servir archivos de audio con autenticación y autorización por tipo de voz
router.get('/file/:folderName/:fileName', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { folderName, fileName } = req.params;
    const userId = req.user!.id;
    const userRoles = req.user!.roles || [];
    
    const filePath = path.join(__dirname, '../../uploads/songs', folderName, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    // Los ADMIN y DIRECTOR pueden acceder a cualquier archivo
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    if (!isAdmin && !isDirector && isCantante) {
      // Para CANTANTES, verificar si tienen acceso según su tipo de voz
      
      // Buscar la canción en la base de datos
      const song = await prisma.song.findFirst({
        where: {
          fileName: fileName,
          isActive: true
        }
      });

      if (!song) {
        return res.status(404).json({ message: 'Archivo no encontrado en base de datos' });
      }

      // Si la canción es CORO u ORIGINAL, todos pueden acceder
      if (song.voiceType === 'CORO' || song.voiceType === 'ORIGINAL') {
        // Acceso permitido para CORO y ORIGINAL
      } else {
        // Verificar si el usuario tiene el tipo de voz de la canción
        const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
          where: { userId },
          select: { voiceType: true }
        });

        const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
        
        if (!userVoiceTypes.includes(song.voiceType as any)) {
          return res.status(403).json({ 
            message: 'No tienes autorización para acceder a este archivo',
            reason: `Esta canción es para tipo de voz ${song.voiceType} y tu no tienes ese tipo asignado`
          });
        }
      }
    }

    // Configurar headers para audio streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Agregar headers para evitar descarga directa
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).json({ message: 'Error sirviendo archivo' });
  }
});

// Ruta alternativa para archivos en la raíz de uploads/songs (también protegida)
router.get('/file/:fileName', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { fileName } = req.params;
    const userId = req.user!.id;
    const userRoles = req.user!.roles || [];
    
    const filePath = path.join(__dirname, '../../uploads/songs', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    // Los ADMIN y DIRECTOR pueden acceder a cualquier archivo
    const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
    const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
    const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

    if (!isAdmin && !isDirector && isCantante) {
      // Para CANTANTES, verificar si tienen acceso según su tipo de voz
      
      // Buscar la canción en la base de datos
      const song = await prisma.song.findFirst({
        where: {
          fileName: fileName,
          isActive: true
        }
      });

      if (!song) {
        return res.status(404).json({ message: 'Archivo no encontrado en base de datos' });
      }

      // Si la canción es CORO u ORIGINAL, todos pueden acceder
      if (song.voiceType === 'CORO' || song.voiceType === 'ORIGINAL') {
        // Acceso permitido para CORO y ORIGINAL
      } else {
        // Verificar si el usuario tiene el tipo de voz de la canción
        const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
          where: { userId },
          select: { voiceType: true }
        });

        const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
        
        if (!userVoiceTypes.includes(song.voiceType as any)) {
          return res.status(403).json({ 
            message: 'No tienes autorización para acceder a este archivo',
            reason: `Esta canción es para tipo de voz ${song.voiceType} y tu no tienes ese tipo asignado`
          });
        }
      }
    }

    // Configurar headers para audio streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Agregar headers para evitar descarga directa
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).json({ message: 'Error sirviendo archivo' });
  }
});

// Eliminar canción
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRoles = req.user!.roles;

    const song = await prisma.song.findUnique({
      where: { id, isActive: true }
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Solo el admin o el usuario que subió la canción pueden eliminarla
    const hasAdminRole = userRoles.some((role: string) => role === 'ADMIN');
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

// Obtener información del servidor para acceso móvil
router.get('/info/server', (req, res) => {
  const PORT_NUMBER = Number(process.env.PORT) || 3001;
  res.json({
    localIP: LOCAL_IP,
    port: PORT_NUMBER,
    audioBaseUrl: `http://${LOCAL_IP}:${PORT_NUMBER}/api/songs/file`
  });
});

// TEST: Ruta de prueba para verificar que el router funciona
router.get('/test-endpoint', (req, res) => {
  res.json({ message: 'Test endpoint works!', timestamp: new Date().toISOString() });
});

export default router;
