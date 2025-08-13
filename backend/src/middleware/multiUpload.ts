import multer from 'multer';
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Crear directorio de uploads si no existe
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento para múltiples archivos
const multiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// Filtro de archivos de audio mejorado
const audioFileFilter = (req: ExpressRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/flac'
  ];

  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a, aac, flac)'));
  }
};

// Configuración para múltiples archivos
export const multiUpload = multer({
  storage: multiStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB por defecto
    files: 10 // Máximo 10 archivos por vez
  },
  fileFilter: audioFileFilter
});

// Middleware para manejar errores de múltiples archivos
export const handleMultiUploadError = (error: any, req: ExpressRequest, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'One or more files are too large. Maximum size is 100MB per file' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Maximum is 10 files per upload' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field name' });
    }
  }
  
  if (error.message?.includes('Only audio files are allowed')) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
};

// Función helper para validar archivos de audio
export const validateAudioFiles = (files: Express.Multer.File[]): { valid: Express.Multer.File[], invalid: string[] } => {
  const valid: Express.Multer.File[] = [];
  const invalid: string[] = [];

  files.forEach(file => {
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3', 
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
      'audio/flac'
    ];

    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      valid.push(file);
    } else {
      invalid.push(file.originalname);
    }
  });

  return { valid, invalid };
};

// Función helper para limpiar archivos no válidos
export const cleanupInvalidFiles = (files: Express.Multer.File[]) => {
  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(`Error deleting invalid file ${file.path}:`, error);
    }
  });
};
