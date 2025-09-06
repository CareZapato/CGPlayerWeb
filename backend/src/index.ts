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
import { swaggerUi, specs } from './config/swagger';
import { prisma } from './utils/prisma';
import DatabaseInitializationService from './services/databaseInitialization';

// Cargar variables de entorno
dotenv.config();

// Crear instancia del servicio de inicialización
const dbInitService = new DatabaseInitializationService();

// Usar IP configurada desde variables de entorno o detectar automáticamente
const getLocalIP = (): string => {
  // Usar IP desde variables de entorno si está disponible
  if (process.env.SERVER_IP) {
    console.log('📍 Usando IP desde variables de entorno:', process.env.SERVER_IP);
    return process.env.SERVER_IP;
  }

  // Fallback a detección automática
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log('📍 IP detectada automáticamente:', iface.address);
        return iface.address;
      }
    }
  }
  console.log('📍 Usando localhost como fallback');
  return 'localhost';
};

const PORT_NUMBER = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const LOCAL_IP = getLocalIP();

console.log('🌐 CONFIGURACIÓN DE RED:');
console.log(`   📍 IP Local: ${LOCAL_IP}`);
console.log(`   🚪 Puerto: ${PORT_NUMBER}`);
console.log(`   🔗 Frontend URL: http://${LOCAL_IP}:5173`);
console.log(`   🔗 Backend URL: http://${LOCAL_IP}:${PORT_NUMBER}`);

const app = express();

// Configure CORS with dynamic origins
const getAllowedOrigins = () => {
  const baseOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    `http://${LOCAL_IP}:5173`,
    `http://${LOCAL_IP}:3000`
  ];

  // Add environment-specific origins
  if (process.env.CORS_ORIGINS) {
    baseOrigins.push(...process.env.CORS_ORIGINS.split(','));
  }

  return baseOrigins;
};

const allowedOrigins = getAllowedOrigins();

// CORS configurado para acceso móvil y red local
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any local network IP on development ports
    const localNetworkPattern = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+:(5173|3000|3001|5000)$/;
    if (localNetworkPattern.test(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
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

// Servir imágenes de playlists (solo imágenes, no archivos de audio)
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images')));

// Servir archivos de letras (PDF, DOC, DOCX, TXT)
app.use('/uploads/lyrics', express.static(path.join(__dirname, '../uploads/lyrics')));

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
  console.log(`🚀 Servidor iniciado exitosamente!`);
  console.log(`📡 Backend corriendo en: http://${HOST}:${PORT_NUMBER}`);
  console.log(`📚 API Docs disponibles en: http://${HOST}:${PORT_NUMBER}/api-docs`);
  
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
