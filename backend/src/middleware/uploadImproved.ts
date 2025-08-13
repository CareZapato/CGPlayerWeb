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

// Filtro de archivos de audio mejorado
const fileFilter = (req: any, file: any, cb: any) => {
  console.log(`🎵 [FILE-FILTER] Checking file:`, {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    fieldname: file.fieldname
  });

  const allowedMimes = [
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
  
  // También verificar por extensión si el MIME type no es reconocido
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  const allowedExtensions = [
    'mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac', 'wma', 'webm', '3gp', 'amr'
  ];
  
  const mimeAllowed = allowedMimes.includes(file.mimetype);
  const extensionAllowed = allowedExtensions.includes(fileExtension);
  
  console.log(`🔍 [FILE-FILTER] Validation:`, {
    mimetype: file.mimetype,
    mimeAllowed,
    extension: fileExtension,
    extensionAllowed,
    finalDecision: mimeAllowed || extensionAllowed
  });
  
  if (mimeAllowed || extensionAllowed) {
    console.log(`✅ [FILE-FILTER] File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`❌ [FILE-FILTER] File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten archivos de audio.`), false);
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
  console.log(`🔥 [MULTER] Error occurred:`, {
    errorType: err.constructor.name,
    message: err.message,
    code: err.code,
    field: err.field,
    stack: err.stack?.split('\n')[0] // Solo la primera línea del stack
  });

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
  console.log(`🗂️ [RENAME-FILES] Starting file renaming process:`, {
    filesCount: files.length,
    title,
    voiceType,
    folderName,
    voiceAssignmentsCount: voiceAssignments?.length || 0
  });
  
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const originalName = path.parse(file.originalname);
    const extension = originalName.ext;
    
    console.log(`📁 [RENAME-FILES] Processing file ${i + 1}/${files.length}:`, {
      originalName: file.originalname,
      currentPath: file.path,
      extension
    });
    
    // Para subida múltiple, usar asignaciones de voz
    let finalVoiceType = voiceType;
    if (voiceAssignments) {
      const assignment = voiceAssignments.find((a: any) => a.filename === file.originalname);
      finalVoiceType = assignment?.voiceType;
      console.log(`🎤 [RENAME-FILES] Voice assignment found:`, {
        filename: file.originalname,
        voiceType: finalVoiceType,
        assignment
      });
    }
    
    // Generar nuevo nombre con patrón título_tipovoz.extensión
    const newFileName = generateFileName(title, finalVoiceType, extension);
    console.log(`📝 [RENAME-FILES] Generated filename:`, {
      originalName: file.originalname,
      newFileName,
      voiceType: finalVoiceType
    });
    
    let finalPath: string;
    let finalFileName: string;
    let finalFolderName: string | undefined;
    
    if (folderName) {
      console.log(`📂 [RENAME-FILES] Creating folder structure:`, { folderName });
      // Crear carpeta específica si se proporciona
      const folderPath = path.join(path.dirname(file.path), folderName);
      console.log(`📂 [RENAME-FILES] Folder paths:`, {
        currentFileDir: path.dirname(file.path),
        targetFolderPath: folderPath,
        folderExists: fs.existsSync(folderPath)
      });
      
      if (!fs.existsSync(folderPath)) {
        console.log(`📂 [RENAME-FILES] Creating folder:`, folderPath);
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`✅ [RENAME-FILES] Folder created successfully`);
      }
      
      finalPath = path.join(folderPath, newFileName);
      finalFileName = newFileName;
      finalFolderName = folderName;
    } else {
      console.log(`📂 [RENAME-FILES] No folder specified, keeping in root`);
      // Mantener en la carpeta raíz de uploads/songs
      finalPath = path.join(path.dirname(file.path), newFileName);
      finalFileName = newFileName;
    }
    
    console.log(`🔄 [RENAME-FILES] File movement:`, {
      from: file.path,
      to: finalPath,
      fileName: finalFileName,
      folderName: finalFolderName
    });
    
    // Renombrar archivo
    try {
      fs.renameSync(file.path, finalPath);
      console.log(`✅ [RENAME-FILES] File moved successfully`);
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
  
  console.log(`✅ [RENAME-FILES] Process completed:`, {
    totalFiles: results.length,
    results: results.map(r => ({ fileName: r.fileName, folderName: r.folderName }))
  });
  
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
