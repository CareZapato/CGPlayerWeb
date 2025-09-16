import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import os from 'os';

// Importar rutas
import authRoutes from './routes/authNew';
import userRoutes from './routes/users';
import songRoutes from './routes/songsImproved';
import playlistRoutes from './routes/playlists';
import lyricRoutes from './routes/lyrics';
import locationRoutes from './routes/locations';
import eventRoutes from './routes/events';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import newsRoutes from './routes/news';
import backupRoutes from './routes/backup';
import profileRoutes from './routes/profile';
import { swaggerUi, specs } from './config/swagger';
import { prisma } from './utils/prisma';
import DatabaseInitializationService from './services/databaseInitialization';
// Importar configuración dinámica
import { getDynamicConfig, injectNetworkConfig, getNetworkConfigEndpoint, getDynamicCorsOrigins } from './middleware/dynamicConfig';
import { networkDetector } from './utils/networkDetector';

// Cargar variables de entorno
dotenv.config(); // .env del backend
dotenv.config({ path: path.join(__dirname, '../../../ip-config.env') }); // ip-config.env del proyecto

// Crear instancia del servicio de inicialización
const dbInitService = new DatabaseInitializationService();

const PORT_NUMBER = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Inicializar configuración de red asíncronamente
let networkConfig: any = null;

async function initializeNetworkConfig() {
  try {
    networkConfig = await getDynamicConfig();
    const urls = await networkDetector.getAccessURLs(PORT_NUMBER);
    
    console.log('🌐 CONFIGURACIÓN DE RED (AUTO-DETECTADA):');
    console.log(`   📍 IP Local: ${networkConfig.serverIP}`);
    console.log(`   🚪 Puerto: ${PORT_NUMBER}`);
    console.log(`   🔗 Frontend URL: ${networkConfig.frontendURL}`);
    console.log(`   🔗 Backend URL: ${networkConfig.backendURL}`);
    console.log(`   � Red local: ${urls.network}`);
    console.log(`   🏠 Local: ${urls.local}`);
  } catch (error) {
    console.error('❌ Error inicializando configuración de red:', error);
    networkConfig = {
      serverIP: 'localhost',
      frontendURL: 'http://localhost:5173',
      backendURL: 'http://localhost:3001',
      corsOrigins: ['http://localhost:5173']
    };
  }
}

const app = express();

// CORS configurado dinámicamente
app.use(cors({
  origin: async (origin, callback) => {
    try {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Obtener origins permitidos dinámicamente
      const allowedOrigins = await getDynamicCorsOrigins();
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow any local network IP on development ports
      const localNetworkPattern = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+:(5173|3000|3001|5000)$/;
      if (localNetworkPattern.test(origin)) {
        return callback(null, true);
      }
      
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    } catch (error) {
      console.error('❌ Error en CORS dinámico:', error);
      // Fallback permisivo en caso de error
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting aumentado para acceso de red
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // aumentado para acceso de red
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Headers adicionales para máxima compatibilidad móvil
app.use((req, res, next) => {
  // Log para debug de requests desde dispositivos externos
  if (req.headers.origin && !req.headers.origin.includes('localhost')) {
    
  }
  
  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware para parsing
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Middleware de logging global
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  
  
  if (req.body && Object.keys(req.body).length > 0) {
    
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body) {
    return originalJson.call(this, body);
  };
  
  // Override res.status to log errors
  const originalStatus = res.status;
  res.status = function(code) {
    if (code >= 400) {
      console.log(`   ❌ Error Status: ${code}`);
    }
    return originalStatus.call(this, code);
  };
  
  next();
});

// ELIMINADO: No servir archivos estáticos directamente por seguridad
// Los archivos de audio ahora solo se sirven a través de endpoints autenticados
// app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Servir imágenes de playlists y perfiles (solo imágenes, no archivos de audio)
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images')));

// Endpoint específico para servir imágenes de perfil con autenticación
app.use('/api/uploads/images/profiles', express.static(path.join(__dirname, '../uploads/images/profiles')));

// Servir archivos de letras (PDF, DOC, DOCX, TXT)
app.use('/uploads/lyrics', express.static(path.join(__dirname, '../uploads/lyrics')));

// Middleware de configuración de red
app.use(injectNetworkConfig);

// Endpoints públicos (sin autenticación)
app.get('/api/health', (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'CGPlayerWeb Backend',
    clientIP,
    version: '1.0.0'
  });
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// Endpoint de configuración de red (público para debugging)
app.get('/api/network-config', getNetworkConfigEndpoint);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CGPlayerWeb API Documentation'
}));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/lyrics', lyricRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', backupRoutes);
app.use('/api/profile', profileRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CGPlayerWeb API is running',
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.listen(PORT_NUMBER, HOST, async () => {
  // Inicializar configuración de red primero
  await initializeNetworkConfig();
  
  console.log('\n🚀 ============================');
  console.log('   CGPlayerWeb Backend v0.10.19');
  console.log('============================== 🚀');
  console.log(`🌍 Servidor corriendo en:`);
  console.log(`   📍 Local: http://localhost:${PORT_NUMBER}`);
  console.log(`   � Red: ${networkConfig?.backendURL || `http://localhost:${PORT_NUMBER}`}`);
  console.log(`   📍 Host: ${HOST}`);
  console.log(`   📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🌐 Frontend: ${networkConfig?.frontendURL || 'http://localhost:5173'}`);
  console.log(`   📚 API Docs: ${networkConfig?.backendURL || `http://localhost:${PORT_NUMBER}`}/api-docs`);
  console.log('============================== 🎵\n');
  
  // Inicialización automática de base de datos
  console.log('\n🔧 Iniciando verificación de base de datos...');
  
  try {
    // Verificar y auto-inicializar la base de datos
    const initResult = await dbInitService.initializeDatabase();
    
    if (initResult.success) {
      console.log(`✅ ${initResult.message}`);
      
      if (initResult.tablesCreated) {
        console.log('🏗️ Estructura de base de datos creada');
      }
      
      if (initResult.userCreated) {
        console.log('👤 Usuario administrador creado automáticamente');
      }
      
      // Mostrar estadísticas actuales
      const status = await dbInitService.getDatabaseStatus();
      console.log(`📊 Estado actual: ${status.users} usuarios, ${status.locations} ubicaciones, ${status.admins} administradores`);
      
    } else {
      console.error(`❌ Error en inicialización: ${initResult.message}`);
      if (initResult.error) {
        console.error(`   Detalle: ${initResult.error}`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error durante la inicialización automática:', error.message);
    
    // Intentar conexión básica como fallback
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      const locationCount = await prisma.location.count();
      console.log(`⚠️ Conexión básica establecida - ${userCount} usuarios, ${locationCount} ubicaciones`);
    } catch (fallbackError: any) {
      console.error('❌ Error crítico de base de datos:', fallbackError.message);
    }
  }
  
  console.log('\n🎵 CGPlayerWeb Backend listo para recibir peticiones');
});

// Manejo graceful del cierre del proceso
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
