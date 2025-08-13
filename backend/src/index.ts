import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import os from 'os';

// Importar rutas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import songRoutes from './routes/songs';
import playlistRoutes from './routes/playlists';
import lyricRoutes from './routes/lyrics';
import locationRoutes from './routes/locations';
import eventRoutes from './routes/events';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

// Función para inicializar la base de datos con datos básicos
async function initializeDatabase() {
  try {
    console.log('🔄 Verificando base de datos...');
    
    // Verificar si ya hay usuarios
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('📊 Base de datos vacía. Cargando datos iniciales...');
      
      // Crear usuarios básicos
      const adminPassword = await bcrypt.hash('admin123', 10);
      const directorPassword = await bcrypt.hash('director123', 10);
      const singerPassword = await bcrypt.hash('singer123', 10);
      
      // Crear administrador
      const admin = await prisma.user.create({
        data: {
          email: 'admin@chilegospel.com',
          username: 'admin',
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'ChileGospel',
          role: 'ADMIN',
          isActive: true
        }
      });
      
      // Crear director musical
      const director = await prisma.user.create({
        data: {
          email: 'director@chilegospel.com',
          username: 'director',
          password: directorPassword,
          firstName: 'Director',
          lastName: 'Musical',
          role: 'DIRECTOR',
          isActive: true
        }
      });
      
      // Crear cantantes
      const singers = [];
      for (let i = 1; i <= 10; i++) {
        const singer = await prisma.user.create({
          data: {
            email: `singer${i}@chilegospel.com`,
            username: `singer${i}`,
            password: singerPassword,
            firstName: `Cantante`,
            lastName: `${i}`,
            role: 'SINGER',
            isActive: true
          }
        });
        singers.push(singer);
      }
      
      // Crear una ubicación por defecto
      const defaultLocation = await prisma.location.create({
        data: {
          name: 'Iglesia Principal',
          type: 'SANTIAGO',
          address: 'Dirección de la Iglesia',
          city: 'Santiago',
          country: 'Chile',
          isActive: true
        }
      });
      
      console.log('✅ Datos iniciales cargados exitosamente:');
      console.log(`   👤 Admin: admin@chilegospel.com / admin123`);
      console.log(`   🎵 Director: director@chilegospel.com / director123`);
      console.log(`   🎤 Cantantes: singer1-10@chilegospel.com / singer123`);
      console.log(`   📍 Ubicación: ${defaultLocation.name}`);
    } else {
      console.log('✅ Base de datos ya contiene datos');
    }
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

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

const PORT_NUMBER = Number(process.env.PORT) || 3001;

const LOCAL_IP = getLocalIP();

const app = express();

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configurado para acceso móvil - MUY PERMISIVO PARA DESARROLLO
app.use(cors({
  origin: true, // Permitir todos los orígenes en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: '*',
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Headers adicionales para máxima compatibilidad móvil
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Log para debug de requests desde dispositivos externos
  if (req.headers.origin && req.headers.origin !== 'http://localhost:5173') {
    console.log('🌍 Request from external device:', {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });
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
  
  console.log(`\n🌐 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`   📍 Client: ${clientIP}`);
  console.log(`   📋 Headers:`, {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers.authorization ? 'Bearer ***' : 'None',
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   📦 Body keys:`, Object.keys(req.body));
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body) {
    console.log(`   ✅ Response ${res.statusCode}:`, typeof body === 'object' ? Object.keys(body) : body);
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

// Servir archivos estáticos (audios subidos)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Endpoints públicos (sin autenticación)
app.get('/api/health', (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  console.log('🏥 Health check desde:', clientIP);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'CGPlayerWeb Backend',
    clientIP,
    version: '1.0.0'
  });
});

app.get('/api/ping', (req, res) => {
  console.log('🏓 Ping desde:', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  res.send('pong');
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/lyrics', lyricRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventRoutes);

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

app.listen(PORT_NUMBER, '0.0.0.0', async () => {
  console.log(`🎵 CGPlayerWeb Backend running on port ${PORT_NUMBER}`);
  console.log(`📡 API URL: http://localhost:${PORT_NUMBER}/api`);
  console.log(`🌐 Network API URL: http://${LOCAL_IP}:${PORT_NUMBER}/api`);
  console.log(`📁 Uploads URL: http://localhost:${PORT_NUMBER}/uploads`);
  console.log(`🎵 Network Uploads URL: http://${LOCAL_IP}:${PORT_NUMBER}/uploads`);
  
  // Verificar y cargar datos iniciales
  await initializeDatabase();
});

export default app;
