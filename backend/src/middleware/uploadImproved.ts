import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Tipos de voz para organización
export const VOICE_TYPES = {
  SOPRANO: 'soprano',
  CONTRALTO: 'contralto', 
  TENOR: 'tenor',
  BARITONE: 'baritono',
  BASS: 'bajo'
} as const;

// Función para normalizar nombres de archivo
const normalizeFileName = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
};

export const generateFolderName = (title: string): string => {
  const normalizedTitle = normalizeFileName(title);
  const timestamp = Date.now();
  return `${normalizedTitle}_${timestamp}`;
};

// Middleware para preparar la carpeta de la canción antes de la subida
export const prepareSongFolder = (req: any, res: any, next: any) => {
  // Solo aplicar si hay un título en el body (necesario para generar carpeta)
  if (req.body && req.body.title) {
    const folderName = generateFolderName(req.body.title);
    const folderPath = path.join(__dirname, '../../uploads/songs', folderName);
    
    
    
    // Crear la carpeta
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Agregar información de carpeta al request
    req.songFolderName = folderName;
    req.songFolderPath = folderPath;
  }
  
  next();
};

// Función para generar nombre de archivo con patrón título_tipovoz.extensión
const generateFileName = (title: string, voiceType?: string, originalExtension?: string): string => {
  const normalizedTitle = normalizeFileName(title);
  const extension = originalExtension || '.m4a';
  
  if (voiceType && voiceType !== 'ORIGINAL') {
    const voiceTypeLower = VOICE_TYPES[voiceType as keyof typeof VOICE_TYPES] || voiceType.toLowerCase();
    return `${normalizedTitle}_${voiceTypeLower}${extension}`;
  }
  
  return `${normalizedTitle}${extension}`;
};

// Configuración de almacenamiento para archivos individuales
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Obtener el título del body si está disponible
    const title = (req as any).body?.title;
    
    if (title) {
      // Generar carpeta específica para la canción
      const folderName = generateFolderName(title);
      const folderPath = path.join(__dirname, '../../uploads/songs', folderName);
      
      
      
      // Crear la carpeta si no existe
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      
      // Agregar información de carpeta al request
      (req as any).songFolderName = folderName;
      (req as any).songFolderPath = folderPath;
      
      cb(null, folderPath);
      return;
    }
    
    // Fallback: usar directorio raíz de songs
    const uploadsDir = path.join(__dirname, '../../uploads/songs');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname);
    const extension = originalName.ext;
    
    // Para subida individual, usar el nombre original temporalmente
    // Se renombrará después con la información del título y tipo de voz
    const tempName = `temp_${Date.now()}_${normalizeFileName(originalName.name)}${extension}`;
    cb(null, tempName);
  }
});

// Configuración de almacenamiento para subida múltiple
const multiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Obtener el título del body si está disponible
    const title = (req as any).body?.title;
    
    if (title) {
      // Generar carpeta específica para la canción (usar la misma para todos los archivos)
      let folderName = (req as any).songFolderName;
      if (!folderName) {
        folderName = generateFolderName(title);
        (req as any).songFolderName = folderName;
      }
      
      const folderPath = path.join(__dirname, '../../uploads/songs', folderName);
      
      
      // Crear la carpeta si no existe
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      
      // Agregar información de carpeta al request
      (req as any).songFolderPath = folderPath;
      
      cb(null, folderPath);
      return;
    }
    
    // Fallback: usar directorio raíz de songs
    const uploadsDir = path.join(__dirname, '../../uploads/songs');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname);
    const extension = originalName.ext;
    
    // Para subida múltiple, mantener nombre temporal hasta procesar
    const tempName = `multi_temp_${Date.now()}_${normalizeFileName(originalName.name)}${extension}`;
    cb(null, tempName);
  }
});

// Filtro de archivos mejorado que permite audio y letras
const fileFilter = (req: any, file: any, cb: any) => {
  
  // Archivos de audio permitidos
  const allowedAudioMimes = [
    // MPEG Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/mpeg3',
    'audio/x-mpeg-3',
    
    // WAV Audio
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    
    // OGG Audio
    'audio/ogg',
    'audio/vorbis',
    'audio/x-ogg',
    
    // MP4 Audio
    'audio/mp4',
    'audio/m4a',
    'audio/mp4a-latm',
    'audio/x-m4a',
    
    // AAC Audio
    'audio/aac',
    'audio/aacp',
    'audio/x-aac',
    
    // FLAC Audio
    'audio/flac',
    'audio/x-flac',
    
    // Otros formatos comunes
    'audio/webm',
    'audio/3gpp',
    'audio/amr',
    'audio/basic',
    'audio/midi',
    'audio/x-midi',
    'audio/x-ms-wma',
    
    // Fallback genérico
    'application/octet-stream' // Algunos archivos pueden venir con este MIME type
  ];

  // Archivos de letras permitidos
  const allowedLyricsMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  // Extensiones permitidas según tipo
  const allowedAudioExtensions = [
    'mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac', 'wma', 'webm', '3gp', 'amr'
  ];
  
  const allowedLyricsExtensions = [
    'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'
  ];
  
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  
  let isValid = false;
  let errorMessage = '';
  
  if (file.fieldname === 'audio') {
    // Validar archivos de audio
    const mimeAllowed = allowedAudioMimes.includes(file.mimetype);
    const extensionAllowed = allowedAudioExtensions.includes(fileExtension);
    isValid = mimeAllowed || extensionAllowed;
    errorMessage = `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten archivos de audio.`;
  } else if (file.fieldname === 'lyrics') {
    // Validar archivos de letras
    const mimeAllowed = allowedLyricsMimes.includes(file.mimetype);
    const extensionAllowed = allowedLyricsExtensions.includes(fileExtension);
    isValid = mimeAllowed || extensionAllowed;
    errorMessage = `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten archivos PDF, DOC, DOCX, TXT, JPG y PNG para letras.`;
  } else {
    // Campo no reconocido
    isValid = false;
    errorMessage = `Campo no reconocido: ${file.fieldname}`;
  }
  

  
  if (isValid) {
    cb(null, true);
  } else {
    console.log(`❌ [FILE-FILTER] File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error(errorMessage), false);
  }
};

// Middleware para subida individual
export const upload = multer({ 
  storage,
  fileFilter,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Middleware para subida múltiple
export const multiUpload = multer({ 
  storage: multiStorage,
  fileFilter,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB por archivo
    files: 10 // Máximo 10 archivos
  }
});

// Manejo de errores de multer
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      console.log(`❌ [MULTER] File too large`);
      return res.status(400).json({ message: 'Archivo demasiado grande. Máximo 100MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      console.log(`❌ [MULTER] Too many files`);
      return res.status(400).json({ message: 'Demasiados archivos. Máximo 10 archivos.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      console.log(`❌ [MULTER] Unexpected file field`);
      return res.status(400).json({ message: 'Campo de archivo inesperado.' });
    }
  }
  
  // Errores de filtro de archivos
  if (err.message && err.message.includes('Tipo de archivo no permitido')) {
    console.log(`❌ [MULTER] File type rejected`);
    return res.status(400).json({ message: err.message });
  }
  
  if (err.message === 'Solo se permiten archivos de audio') {
    console.log(`❌ [MULTER] Invalid file type (legacy message)`);
    return res.status(400).json({ message: err.message });
  }
  
  console.log(`❌ [MULTER] Unknown error:`, err);
  next(err);
};

// Función para renombrar archivos después de subida múltiple
export const renameUploadedFiles = async (
  files: Express.Multer.File[], 
  title: string, 
  voiceType?: string,
  folderName?: string,
  voiceAssignments?: any[]
): Promise<{ filePath: string; fileName: string; folderName?: string }[]> => {
  
  
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const originalName = path.parse(file.originalname);
    const extension = originalName.ext;
    
    
    
    // Para subida múltiple, usar asignaciones de voz
    let finalVoiceType = voiceType;
    if (voiceAssignments) {
      const assignment = voiceAssignments.find((a: any) => a.filename === file.originalname);
      finalVoiceType = assignment?.voiceType;
      
    }
    
    // Generar nuevo nombre con patrón título_tipovoz.extensión
    const newFileName = generateFileName(title, finalVoiceType, extension);
    
    
    let finalPath: string;
    let finalFileName: string;
    let finalFolderName: string | undefined;
    
    if (folderName) {
      
      // El archivo ya está en la carpeta correcta (creada por el storage)
      // Solo necesitamos renombrarlo en la misma ubicación
      const currentDir = path.dirname(file.path);
      finalPath = path.join(currentDir, newFileName);
      finalFileName = newFileName;
      finalFolderName = folderName;
      
      
    } else {
      // Mantener en la carpeta raíz de uploads/songs
      finalPath = path.join(path.dirname(file.path), newFileName);
      finalFileName = newFileName;
    }
    
    // Renombrar archivo
    try {
      fs.renameSync(file.path, finalPath);
    } catch (error) {
      console.error(`❌ [RENAME-FILES] Error moving file:`, error);
      throw error;
    }
    
    results.push({
      filePath: finalPath,
      fileName: finalFileName,
      folderName: finalFolderName
    });
  }
  
  return results;
};

// Función para limpiar archivos temporales (sobrecarga para diferentes tipos)
export const cleanupFiles = (files: string[] | Express.Multer.File[]) => {
  files.forEach(file => {
    const filePath = typeof file === 'string' ? file : file.path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

// Función para limpiar carpeta si está vacía
export const cleanupFolder = (folderPath: string) => {
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    if (files.length === 0) {
      fs.rmdirSync(folderPath);
    }
  }
};

export { generateFileName, normalizeFileName };
