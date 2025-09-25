import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import multer from 'multer';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { promisify } from 'util';
import { exec } from 'child_process';

const router = Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Configurar directorio de uploads para backups
const projectRoot = path.resolve(__dirname, '../../..');
const upload = multer({ dest: path.join(projectRoot, 'temp-uploads') });

// Función para limpiar directorios de uploads (excepto READMEs)
const cleanUploadsDirectories = async (): Promise<void> => {
  console.log('🧹 Iniciando limpieza de directorios de uploads...');
  
  const uploadsDir = path.join(projectRoot, 'backend', 'uploads');
  const dirsToClean = [
    path.join(uploadsDir, 'images', 'profiles'),
    path.join(uploadsDir, 'images', 'playlists'),
    path.join(uploadsDir, 'songs')
  ];

  for (const dirPath of dirsToClean) {
    if (fs.existsSync(dirPath)) {
      console.log(`🗑️ Limpiando: ${path.relative(uploadsDir, dirPath)}`);
      
      const files = fs.readdirSync(dirPath);
      let deleted = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const isReadme = file.toLowerCase().includes('readme');
        
        if (!isReadme) {
          try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
            deleted++;
          } catch (error) {
            console.warn(`⚠️ Error eliminando ${file}:`, error);
          }
        }
      }
      
      console.log(`   ✅ ${deleted} elementos eliminados (READMEs preservados)`);
    } else {
      console.log(`   ℹ️ Directorio no existe: ${path.relative(uploadsDir, dirPath)}`);
    }
  }
  
  console.log('✅ Limpieza de uploads completada');
};

// Función mejorada para detectar y mergear diferencias en campos de BD
// Función para mergear un registro individual con valores por defecto
const mergeRecordData = (record: any, tableName: string): any => {
  const mergedRecord = { ...record };
  
  // Agregar campos que podrían faltar según el tipo de tabla
  const defaultFields: Record<string, any> = {
    status: 'CONFIRMED',
    isActive: true,
    isPrimary: false,
    isHighlighted: false,
    isSynchronized: false,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString()
  };

  // Aplicar campos por defecto según el tipo de tabla
  if (tableName === 'user' || tableName === 'users') {
    // Asegurar que los usuarios tengan el campo status
    if (!record.hasOwnProperty('status')) {
      mergedRecord.status = 'CONFIRMED';
    }
  }

  return mergedRecord;
};

const mergeBackupData = async (backupData: any): Promise<any> => {
  console.log('🔍 Analizando diferencias entre backup y esquema actual...');
  
  // Obtener esquema actual de la base de datos
  const currentSchema: Record<string, string[]> = {
    users: await prisma.user.findFirst().then(u => u ? Object.keys(u) : []).catch(() => []),
    songs: await prisma.song.findFirst().then(s => s ? Object.keys(s) : []).catch(() => []),
    events: await prisma.event.findFirst().then(e => e ? Object.keys(e) : []).catch(() => []),
    playlists: await prisma.playlist.findFirst().then(p => p ? Object.keys(p) : []).catch(() => [])
  };

  const mergedData = { ...backupData };
  let fieldsMerged = 0;

  // Para cada tabla en el backup
  for (const [tableName, records] of Object.entries(backupData)) {
    if (Array.isArray(records) && records.length > 0) {
      const backupFields = Object.keys(records[0]);
      const currentFields = currentSchema[tableName] || [];
      
      // Detectar campos faltantes en el esquema actual
      const missingFields = backupFields.filter(field => !currentFields.includes(field));
      const extraFields = currentFields.filter(field => !backupFields.includes(field));
      
      if (missingFields.length > 0 || extraFields.length > 0) {
        console.log(`📋 ${tableName}:`);
        if (missingFields.length > 0) {
          console.log(`   📤 Campos en backup pero no en esquema: ${missingFields.join(', ')}`);
        }
        if (extraFields.length > 0) {
          console.log(`   📥 Campos en esquema pero no en backup: ${extraFields.join(', ')}`);
        }
      }

      // Mergear registros agregando campos faltantes con valores por defecto
      mergedData[tableName] = records.map((record: any) => {
        const mergedRecord = { ...record };
        
        // Agregar campos que existen en el esquema pero no en el backup
        for (const extraField of extraFields) {
          if (!(extraField in mergedRecord)) {
            // Valores por defecto según el tipo esperado
            switch (extraField) {
              case 'status':
                mergedRecord[extraField] = 'CONFIRMED';
                break;
              case 'isActive':
                mergedRecord[extraField] = true;
                break;
              case 'isPrimary':
                mergedRecord[extraField] = false;
                break;
              case 'isHighlighted':
                mergedRecord[extraField] = false;
                break;
              case 'isSynchronized':
                mergedRecord[extraField] = false;
                break;
              case 'createdAt':
              case 'updatedAt':
                mergedRecord[extraField] = new Date().toISOString();
                break;
              default:
                mergedRecord[extraField] = null;
            }
            fieldsMerged++;
          }
        }
        
        return mergedRecord;
      });
    }
  }

  if (fieldsMerged > 0) {
    console.log(`✅ Agregados ${fieldsMerged} campos faltantes con valores por defecto`);
  } else {
    console.log('✅ No se requieren ajustes en los datos');
  }

  return mergedData;
};

// Ruta para limpiar archivos de uploads (nueva funcionalidad)
router.post('/backup/clean-uploads', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🧹 Iniciando limpieza manual de uploads...');
    await cleanUploadsDirectories();
    
    res.json({
      success: true,
      message: 'Directorios de uploads limpiados exitosamente (READMEs preservados)'
    });
  } catch (error) {
    console.error('Error cleaning uploads:', error);
    res.status(500).json({ 
      error: 'Error limpiando archivos uploads',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Crear backup completo
router.post('/backup/create', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Iniciando creación de backup completo...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `cgplayer-backup-${timestamp}`;
    
    // Usar directorio temporal en lugar de guardar permanentemente en el servidor
    const tempDir = path.join(projectRoot, 'temp-uploads', `backup-${Date.now()}`);
    const zipPath = path.join(projectRoot, 'temp-uploads', `${backupName}.zip`);

    // Crear directorio temporal
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 1. Exportar base de datos
    console.log('📊 Exportando base de datos...');
    const dbPath = path.join(tempDir, 'database.json');
    
    // Crear backup en formato JSON directo (más confiable)
    console.log('📋 Exportando datos de todas las tablas...');
    const backupData = {
      users: await prisma.user.findMany(),
      userRoles: await prisma.userRole_DB.findMany(),
      userVoiceProfiles: await prisma.userVoiceProfile.findMany(),
      songs: await prisma.song.findMany(),
      lyricsFiles: await prisma.lyricsFile.findMany(),
      songAssignments: await prisma.songAssignment.findMany(),
      playlists: await prisma.playlist.findMany(),
      playlistItems: await prisma.playlistItem.findMany(),
      lyrics: await prisma.lyric.findMany(),
      locations: await prisma.location.findMany(),
      events: await prisma.event.findMany(),
      eventPlaylists: await prisma.eventPlaylist.findMany(),
      eventAttendees: await prisma.eventAttendee.findMany(),
      eventJoinRequests: await prisma.eventJoinRequest.findMany(),
      eventAttendance: await prisma.eventAttendance.findMany(),
      eventSongs: await prisma.eventSong.findMany(),
      soloists: await prisma.soloist.findMany(),
      news: await prisma.news.findMany()
    };
    
    // Mostrar estadísticas del backup
    console.log('📊 Estadísticas del backup:');
    Object.entries(backupData).forEach(([table, data]) => {
      console.log(`   - ${table}: ${data.length} registros`);
    });
    
    fs.writeFileSync(dbPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log('✅ Base de datos exportada (formato JSON)');

    // 2. Copiar archivos uploads (incluyendo imágenes de perfil)
    console.log('📁 Copiando archivos...');
    const uploadsDir = path.join(projectRoot, 'backend', 'uploads');
    const backupUploadsDir = path.join(tempDir, 'uploads');

    const copyDir = (src: string, dest: string) => {
      if (!fs.existsSync(src)) return;
      
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      for (const file of files) {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        
        if (fs.statSync(srcFile).isDirectory()) {
          copyDir(srcFile, destFile);
        } else {
          fs.copyFileSync(srcFile, destFile);
        }
      }
    };

    copyDir(uploadsDir, backupUploadsDir);
    
    // Verificar si se copiaron las imágenes de perfil
    const profileImagesDir = path.join(backupUploadsDir, 'images', 'profiles');
    let profileImagesCount = 0;
    if (fs.existsSync(profileImagesDir)) {
      const profileImages = fs.readdirSync(profileImagesDir);
      profileImagesCount = profileImages.length;
      console.log(`✅ Archivos copiados (incluyendo ${profileImagesCount} imágenes de perfil)`);
    } else {
      console.log('✅ Archivos copiados');
    }

    // 3. Crear archivo de información (incluyendo información de perfiles)
    const infoPath = path.join(tempDir, 'backup-info.json');
    
    // Contar usuarios con imágenes de perfil
    const usersWithProfileImages = backupData.users.filter((user: any) => user.profileImage).length;
    
    const backupInfo = {
      version: '1.1', // Incrementado para indicar soporte de perfiles
      created: new Date().toISOString(),
      type: 'complete',
      database: 'included',
      files: 'included',
      profileSystem: 'included', // Nueva característica
      tables: Object.keys(backupData),
      totalRecords: Object.values(backupData).reduce((sum, table) => sum + table.length, 0),
      profileStats: {
        totalUsers: backupData.users.length,
        usersWithProfileImages,
        profileImagesFiles: profileImagesCount
      }
    };
    
    fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2), 'utf8');
    console.log('✅ Información del backup creada');

    // 4. Crear archivo ZIP
    console.log('📦 Creando archivo ZIP...');
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`✅ Backup creado: ${archive.pointer()} bytes`);
        
        // Responder con descarga del archivo
        res.download(zipPath, `${backupName}.zip`, (err) => {
          if (err) {
            console.error('Error enviando archivo:', err);
            return;
          }
          
          // Limpiar archivos temporales inmediatamente después de la descarga
          console.log('🧹 Limpiando archivos temporales...');
          setTimeout(() => {
            try {
              if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log('✅ Directorio temporal eliminado');
              }
              if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
                console.log('✅ Archivo ZIP temporal eliminado');
              }
            } catch (cleanupError) {
              console.error('⚠️ Error limpiando archivos temporales:', cleanupError);
            }
          }, 2000); // Tiempo reducido
          
          resolve();
        });
      });

      archive.on('error', (err: any) => {
        console.error('Error creating zip:', err);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      error: 'Error creando backup',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Restaurar backup
router.post('/backup/restore', authenticateToken, requireAdmin, upload.single('backup'), async (req: Request, res: Response) => {
  // Aumentar timeout para operaciones largas en VPS
  const originalTimeout = req.socket.timeout || 0;
  req.socket.setTimeout(300000); // 5 minutos
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo de backup' });
    }

    console.log('🔄 Iniciando restauración de backup...');
    console.log('⚙️ Configuración VPS: timeout extendido a 5 minutos');
    
    const tempDir = path.join(projectRoot, 'temp-restore');
    const zipPath = req.file.path;
    
    console.log('📁 Archivo ZIP:', zipPath);
    console.log('📁 Directorio temporal:', tempDir);

    // Limpiar directorio temporal si existe
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // 1. Extraer ZIP
    console.log('📦 Extrayendo backup...');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);
    console.log('✅ Backup extraído exitosamente');

    // Debug: Listar archivos extraídos
    console.log('🔍 Archivos encontrados en el backup:');
    const extractedFiles = fs.readdirSync(tempDir, { recursive: true });
    extractedFiles.forEach(file => {
      const fullPath = path.join(tempDir, file.toString());
      const stats = fs.statSync(fullPath);
      console.log(`   - ${file} (${stats.isDirectory() ? 'DIR' : 'FILE'} - ${stats.size || 0} bytes)`);
    });

    // 2. Verificar estructura del backup con retrocompatibilidad completa
    const backupInfoPath = path.join(tempDir, 'backup-info.json');
    let dbPath = path.join(tempDir, 'database.json');
    const uploadsPath = path.join(tempDir, 'uploads');

    // Verificar archivo de base de datos (JSON o SQL)
    let dbContent = '';
    if (fs.existsSync(dbPath)) {
      console.log('📋 Encontrado database.json');
      dbContent = fs.readFileSync(dbPath, 'utf8');
    } else {
      const sqlDbPath = path.join(tempDir, 'database.sql');
      if (fs.existsSync(sqlDbPath)) {
        console.log('📋 Encontrado database.sql (formato legacy)');
        dbPath = sqlDbPath;
        dbContent = fs.readFileSync(dbPath, 'utf8');
      } else {
        console.error('❌ No se encontró archivo de base de datos');
        console.log('📁 Contenido del directorio temporal:');
        fs.readdirSync(tempDir).forEach(file => {
          const fullPath = path.join(tempDir, file.toString());
          const stats = fs.statSync(fullPath);
          console.log(`   - ${file} (${stats.isDirectory() ? 'DIR' : 'FILE'} - ${stats.size || 0} bytes)`);
        });
        throw new Error('Archivo de base de datos no encontrado en el backup');
      }
    }

    // Backup info (opcional para retrocompatibilidad)
    let backupInfo;
    if (fs.existsSync(backupInfoPath)) {
      backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
      console.log('ℹ️ Información del backup:', backupInfo);
    } else {
      console.log('⚠️ No se encontró backup-info.json, creando información básica');
      backupInfo = {
        version: 'legacy',
        created: 'unknown',
        type: 'complete',
        database: 'included',
        files: 'included'
      };
    }

    // 3. Obtener estadísticas previas para comparar
    const statsBefore = {
      users: await prisma.user.count(),
      songs: await prisma.song.count(),
      playlists: await prisma.playlist.count(),
      events: await prisma.event.count()
    };
    console.log('📊 Estado antes de la restauración:', statsBefore);

    // 4. Restaurar base de datos
    console.log('📊 Iniciando restauración de base de datos...');
    
    try {
      // Usar el contenido ya leído arriba
      console.log('📖 Procesando archivo de base de datos');
      console.log(`📏 Tamaño del archivo: ${dbContent.length} caracteres`);
      console.log(`🔍 Primeros 200 caracteres: "${dbContent.substring(0, 200)}..."`);
      
      // Intentar detectar formato JSON
      let data: any = {};
      
      try {
        // Intentar parsear como JSON directamente
        if (dbContent.trim().startsWith('{')) {
          data = JSON.parse(dbContent);
          console.log('📋 Formato JSON detectado correctamente');
        } else {
          // Si no es JSON puro, buscar datos en formato SQL legacy
          console.log('⚠️ No es formato JSON puro, parseando formato SQL legacy...');
          
          // Mostrar más contexto del archivo para debug
          console.log('🔍 Muestra del contenido (líneas 1-10):');
          const lines = dbContent.split('\n').slice(0, 10);
          lines.forEach((line, i) => console.log(`   ${i+1}: ${line}`));
          
          // Buscar secciones de datos que empiecen con "-- Data for table"
          const sections = dbContent.split(/-- Data for table (\w+)/);
          console.log(`📋 Encontradas ${Math.floor((sections.length - 1) / 2)} secciones de tablas`);
          
          for (let i = 1; i < sections.length; i += 2) {
            const tableName = sections[i].trim();
            const tableContent = sections[i + 1] || '';
            
            console.log(`🔍 Procesando tabla: ${tableName}`);
            console.log(`🔍 Contenido de la tabla (primeros 300 chars):`);
            console.log(tableContent.substring(0, 300));
            
            try {
              // Buscar el JSON después de "-- Records: X"
              const recordsRegex = /-- Records: (\d+)\s*[\r\n]+([\s\S]*?)(?=\n-- |\n$|$)/;
              const recordsMatch = tableContent.match(recordsRegex);
              
              if (recordsMatch && recordsMatch[2]) {
                const jsonStr = recordsMatch[2].trim();
                console.log(`📋 Encontrados ${recordsMatch[1]} registros para ${tableName}`);
                console.log(`🔍 JSON extraído (primeros 200 chars): "${jsonStr.substring(0, 200)}..."`);
                
                if (jsonStr.startsWith('[') || jsonStr.startsWith('{')) {
                  const parsed = JSON.parse(jsonStr);
                  
                  // Mapear nombres de tablas del formato legacy a los nuevos
                  let mappedTableName = tableName.toLowerCase();
                  const tableMapping: { [key: string]: string } = {
                    'User': 'users',
                    'UserRole_DB': 'userRoles', 
                    'UserVoiceProfile': 'userVoiceProfiles',
                    'Song': 'songs',
                    'LyricsFile': 'lyricsFiles',
                    'SongAssignment': 'songAssignments',
                    'Playlist': 'playlists',
                    'PlaylistItem': 'playlistItems',
                    'Lyric': 'lyrics',
                    'Location': 'locations',
                    'Event': 'events',
                    'EventPlaylist': 'eventPlaylists',
                    'EventAttendee': 'eventAttendees',
                    'EventJoinRequest': 'eventJoinRequests',
                    'EventAttendance': 'eventAttendance',
                    'EventSong': 'eventSongs',
                    'Soloist': 'soloists',
                    'News': 'news'
                  };
                  
                  if (tableMapping[tableName]) {
                    mappedTableName = tableMapping[tableName];
                  }
                  
                  data[mappedTableName] = Array.isArray(parsed) ? parsed : [parsed];
                  console.log(`✅ ${tableName} -> ${mappedTableName}: ${data[mappedTableName].length} registros parseados`);
                } else {
                  console.log(`⚠️ El JSON para ${tableName} no tiene formato válido`);
                }
              } else {
                console.log(`⚠️ No se encontró patrón de registros para la tabla ${tableName}`);
              }
            } catch (error) {
              console.warn(`⚠️ Error parseando tabla ${tableName}:`, error);
            }
          }
          
          console.log('📋 Parsing de formato SQL legacy completado');
        }
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('El archivo de backup no contiene JSON válido: ' + (parseError instanceof Error ? parseError.message : 'Error desconocido'));
      }

      console.log('📋 Estructura del backup procesada');
      console.log('🔍 Tablas encontradas:');
      
      let totalRecordsInBackup = 0;
      Object.keys(data).forEach(key => {
        const count = Array.isArray(data[key]) ? data[key].length : 0;
        console.log(`   - ${key}: ${count} registros`);
        totalRecordsInBackup += count;
      });
      
      console.log(`📊 Total de registros en el backup: ${totalRecordsInBackup}`);
      
      // Validar que tenemos datos para restaurar
      const hasData = Object.values(data).some((value: any) => Array.isArray(value) && value.length > 0);
      if (!hasData) {
        throw new Error('El backup no contiene datos válidos para restaurar');
      }
      
      console.log('✅ Backup válido, iniciando transacción de restauración...');
        
      // Usar transacción para asegurar atomicidad
      await prisma.$transaction(async (tx) => {
        // PASO 1: LIMPIAR COMPLETAMENTE LA BASE DE DATOS
        console.log('🗑️ INICIANDO LIMPIEZA COMPLETA DE BASE DE DATOS...');
        
        // Eliminar en orden para evitar violaciones de FK
        console.log('🗑️ Eliminando datos de tablas dependientes...');
        await tx.eventAttendance.deleteMany();
        console.log('   - eventAttendance: ✅ limpiada');
        await tx.eventJoinRequest.deleteMany();
        console.log('   - eventJoinRequest: ✅ limpiada');
        await tx.eventAttendee.deleteMany();
        console.log('   - eventAttendee: ✅ limpiada');
        await tx.eventPlaylist.deleteMany();
        console.log('   - eventPlaylist: ✅ limpiada');
        await tx.eventSong.deleteMany();
        console.log('   - eventSong: ✅ limpiada');
        await tx.soloist.deleteMany();
        console.log('   - soloist: ✅ limpiada');
        await tx.playlistItem.deleteMany();
        console.log('   - playlistItem: ✅ limpiada');
        await tx.songAssignment.deleteMany();
        console.log('   - songAssignment: ✅ limpiada');
        await tx.lyricsFile.deleteMany();
        console.log('   - lyricsFile: ✅ limpiada');
        await tx.lyric.deleteMany();
        console.log('   - lyric: ✅ limpiada');
        await tx.userVoiceProfile.deleteMany();
        console.log('   - userVoiceProfile: ✅ limpiada');
        await tx.userRole_DB.deleteMany();
        console.log('   - userRole_DB: ✅ limpiada');
        
        // Luego las tablas principales
        console.log('🗑️ Eliminando datos de tablas principales...');
        await tx.event.deleteMany();
        console.log('   - event: ✅ limpiada');
        await tx.playlist.deleteMany();
        console.log('   - playlist: ✅ limpiada');
        await tx.song.deleteMany();
        console.log('   - song: ✅ limpiada');
        await tx.user.deleteMany();
        console.log('   - user: ✅ limpiada');
        await tx.location.deleteMany();
        console.log('   - location: ✅ limpiada');
        await tx.news.deleteMany();
        console.log('   - news: ✅ limpiada');
        
        // PASO 2: VERIFICAR QUE ESTÁ LIMPIA
        console.log('🔍 Verificando limpieza...');
        const cleanCheck = {
          users: await tx.user.count(),
          songs: await tx.song.count(),
          playlists: await tx.playlist.count(),
          events: await tx.event.count()
        };
        console.log('📊 Conteo después de limpieza:', cleanCheck);
        
        if (Object.values(cleanCheck).some(count => count > 0)) {
          throw new Error('La base de datos no se limpió completamente');
        }
        
        // PASO 3: RESTAURAR DATOS CON MERGE DE CAMPOS
        console.log('📥 INICIANDO RESTAURACIÓN DE DATOS...');
        let totalRestored = 0;
        
        // Tablas padre primero (sin dependencias)
        if (data.locations?.length > 0) {
          const mergedLocations = data.locations.map((location: any) => mergeRecordData(location, 'location'));
          await tx.location.createMany({ data: mergedLocations });
          console.log(`✅ ${data.locations.length} ubicaciones restauradas (con merge de campos)`);
          totalRestored += data.locations.length;
        }
        
        if (data.users?.length > 0) {
          const mergedUsers = data.users.map((user: any) => mergeRecordData(user, 'user'));
          await tx.user.createMany({ data: mergedUsers });
          console.log(`✅ ${data.users.length} usuarios restaurados (con merge de campos)`);
          totalRestored += data.users.length;
        }
        
        if (data.userRoles?.length > 0) {
          const mergedUserRoles = data.userRoles.map((userRole: any) => mergeRecordData(userRole, 'userRole'));
          await tx.userRole_DB.createMany({ data: mergedUserRoles });
          console.log(`✅ ${data.userRoles.length} roles de usuario restaurados (con merge de campos)`);
          totalRestored += data.userRoles.length;
        }
        
        if (data.userVoiceProfiles?.length > 0) {
          const mergedUserVoiceProfiles = data.userVoiceProfiles.map((userVoiceProfile: any) => mergeRecordData(userVoiceProfile, 'userVoiceProfile'));
          await tx.userVoiceProfile.createMany({ data: mergedUserVoiceProfiles });
          console.log(`✅ ${data.userVoiceProfiles.length} perfiles de voz restaurados (con merge de campos)`);
          totalRestored += data.userVoiceProfiles.length;
        }
        
        if (data.songs?.length > 0) {
          const mergedSongs = data.songs.map((song: any) => mergeRecordData(song, 'song'));
          await tx.song.createMany({ data: mergedSongs });
          console.log(`✅ ${data.songs.length} canciones restauradas (con merge de campos)`);
          totalRestored += data.songs.length;
        }
        
        if (data.lyricsFiles?.length > 0) {
          const mergedLyricsFiles = data.lyricsFiles.map((lyricsFile: any) => mergeRecordData(lyricsFile, 'lyricsFile'));
          await tx.lyricsFile.createMany({ data: mergedLyricsFiles });
          console.log(`✅ ${data.lyricsFiles.length} archivos de letras restaurados (con merge de campos)`);
          totalRestored += data.lyricsFiles.length;
        }
        
        if (data.lyrics?.length > 0) {
          const mergedLyrics = data.lyrics.map((lyric: any) => mergeRecordData(lyric, 'lyric'));
          await tx.lyric.createMany({ data: mergedLyrics });
          console.log(`✅ ${data.lyrics.length} letras restauradas (con merge de campos)`);
          totalRestored += data.lyrics.length;
        }
        
        if (data.songAssignments?.length > 0) {
          const mergedSongAssignments = data.songAssignments.map((songAssignment: any) => mergeRecordData(songAssignment, 'songAssignment'));
          await tx.songAssignment.createMany({ data: mergedSongAssignments });
          console.log(`✅ ${data.songAssignments.length} asignaciones de canciones restauradas (con merge de campos)`);
          totalRestored += data.songAssignments.length;
        }
        
        if (data.playlists?.length > 0) {
          const mergedPlaylists = data.playlists.map((playlist: any) => mergeRecordData(playlist, 'playlist'));
          await tx.playlist.createMany({ data: mergedPlaylists });
          console.log(`✅ ${data.playlists.length} playlists restauradas (con merge de campos)`);
          totalRestored += data.playlists.length;
        }
        
        if (data.playlistItems?.length > 0) {
          const mergedPlaylistItems = data.playlistItems.map((playlistItem: any) => mergeRecordData(playlistItem, 'playlistItem'));
          await tx.playlistItem.createMany({ data: mergedPlaylistItems });
          console.log(`✅ ${data.playlistItems.length} elementos de playlist restaurados (con merge de campos)`);
          totalRestored += data.playlistItems.length;
        }
        
        if (data.events?.length > 0) {
          const mergedEvents = data.events.map((event: any) => mergeRecordData(event, 'event'));
          await tx.event.createMany({ data: mergedEvents });
          console.log(`✅ ${data.events.length} eventos restaurados (con merge de campos)`);
          totalRestored += data.events.length;
        }
        
        if (data.eventPlaylists?.length > 0) {
          const mergedEventPlaylists = data.eventPlaylists.map((eventPlaylist: any) => mergeRecordData(eventPlaylist, 'eventPlaylist'));
          await tx.eventPlaylist.createMany({ data: mergedEventPlaylists });
          console.log(`✅ ${data.eventPlaylists.length} playlists de eventos restauradas (con merge de campos)`);
          totalRestored += data.eventPlaylists.length;
        }
        
        if (data.eventAttendees?.length > 0) {
          const mergedEventAttendees = data.eventAttendees.map((eventAttendee: any) => mergeRecordData(eventAttendee, 'eventAttendee'));
          await tx.eventAttendee.createMany({ data: mergedEventAttendees });
          console.log(`✅ ${data.eventAttendees.length} asistentes a eventos restaurados (con merge de campos)`);
          totalRestored += data.eventAttendees.length;
        }
        
        if (data.eventJoinRequests?.length > 0) {
          const mergedEventJoinRequests = data.eventJoinRequests.map((eventJoinRequest: any) => mergeRecordData(eventJoinRequest, 'eventJoinRequest'));
          await tx.eventJoinRequest.createMany({ data: mergedEventJoinRequests });
          console.log(`✅ ${data.eventJoinRequests.length} solicitudes de eventos restauradas (con merge de campos)`);
          totalRestored += data.eventJoinRequests.length;
        }
        
        if (data.eventSongs?.length > 0) {
          const mergedEventSongs = data.eventSongs.map((eventSong: any) => mergeRecordData(eventSong, 'eventSong'));
          await tx.eventSong.createMany({ data: mergedEventSongs });
          console.log(`✅ ${data.eventSongs.length} canciones de eventos restauradas (con merge de campos)`);
          totalRestored += data.eventSongs.length;
        }
        
        if (data.eventAttendance?.length > 0) {
          const mergedEventAttendance = data.eventAttendance.map((eventAttendance: any) => mergeRecordData(eventAttendance, 'eventAttendance'));
          await tx.eventAttendance.createMany({ data: mergedEventAttendance });
          console.log(`✅ ${data.eventAttendance.length} asistencias a eventos restauradas (con merge de campos)`);
          totalRestored += data.eventAttendance.length;
        }
        
        if (data.soloists?.length > 0) {
          const mergedSoloists = data.soloists.map((soloist: any) => mergeRecordData(soloist, 'soloist'));
          await tx.soloist.createMany({ data: mergedSoloists });
          console.log(`✅ ${data.soloists.length} solistas restaurados (con merge de campos)`);
          totalRestored += data.soloists.length;
        }
        
        if (data.news?.length > 0) {
          const mergedNews = data.news.map((news: any) => mergeRecordData(news, 'news'));
          await tx.news.createMany({ data: mergedNews });
          console.log(`✅ ${data.news.length} noticias restauradas (con merge de campos)`);
          totalRestored += data.news.length;
        }
        
      console.log(`🎉 RESTAURACIÓN DE BASE DE DATOS COMPLETADA: ${totalRestored} registros totales`);
      
      // PASO 4: LIMPIAR DIRECTORIOS DE UPLOADS ANTES DE RESTAURAR ARCHIVOS
      console.log('🧹 LIMPIANDO DIRECTORIOS DE UPLOADS...');
      try {
        await cleanUploadsDirectories();
        console.log('✅ Directorios de uploads limpiados correctamente');
      } catch (cleanError) {
        console.warn('⚠️ Advertencia al limpiar uploads:', cleanError);
      }
    });      // PASO 4: VERIFICAR RESULTADOS FINALES
      const statsAfter = {
        users: await prisma.user.count(),
        songs: await prisma.song.count(),
        playlists: await prisma.playlist.count(),
        events: await prisma.event.count(),
        locations: await prisma.location.count()
      };
      console.log('📊 ESTADO FINAL DESPUÉS DE LA RESTAURACIÓN:', statsAfter);
        
      console.log('✅ Base de datos restaurada exitosamente');
    } catch (error) {
      console.error('Error restaurando base de datos:', error);
      throw new Error('Error restaurando base de datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }

    // 5. Restaurar archivos (incluyendo imágenes de perfil)
    console.log('📁 INICIANDO RESTAURACIÓN DE ARCHIVOS...');
    let filesRestored = 0;
    
    try {
      if (!fs.existsSync(uploadsPath)) {
        console.log('ℹ️ No hay archivos para restaurar en el backup');
        return;
      }

      const targetUploadsDir = path.join(projectRoot, 'backend', 'uploads');
      
      // 🔍 DIAGNÓSTICO DETALLADO DEL SISTEMA
      console.log('🔍 === DIAGNÓSTICO COMPLETO DEL SISTEMA ===');
      console.log(`📍 Directorio objetivo: ${targetUploadsDir}`);
      console.log(`📍 Directorio origen: ${uploadsPath}`);
      console.log(`📍 Platform: ${process.platform}`);
      console.log(`📍 Node version: ${process.version}`);
      console.log(`📍 Process UID: ${process.getuid ? process.getuid() : 'N/A'}`);
      console.log(`📍 Process GID: ${process.getgid ? process.getgid() : 'N/A'}`);
      
      if (fs.existsSync(targetUploadsDir)) {
        const stats = fs.statSync(targetUploadsDir);
        console.log(`📍 Directorio objetivo existe - Permisos: ${stats.mode.toString(8)}`);
        console.log(`📍 Owner UID: ${stats.uid}, GID: ${stats.gid}`);
        
        // Listar contenido actual con detalles
        try {
          const currentFiles = fs.readdirSync(targetUploadsDir);
          console.log(`📍 Archivos/directorios actuales: ${currentFiles.length}`);
          currentFiles.forEach((file, index) => {
            if (index < 10) { // Limitar a primeros 10 para no saturar logs
              const filePath = path.join(targetUploadsDir, file);
              const fileStats = fs.statSync(filePath);
              console.log(`     ${index + 1}. ${file} (${fileStats.isDirectory() ? 'DIR' : 'FILE'}, ${fileStats.size} bytes, permisos: ${fileStats.mode.toString(8)})`);
            }
          });
          if (currentFiles.length > 10) {
            console.log(`     ... y ${currentFiles.length - 10} elementos más`);
          }
        } catch (listError) {
          console.error(`📍 ERROR listando contenido actual:`, listError);
        }
      } else {
        console.log(`📍 Directorio objetivo NO existe`);
      }
      
      // Verificar contenido del backup
      try {
        const backupFiles = fs.readdirSync(uploadsPath);
        console.log(`📍 Archivos en backup: ${backupFiles.length}`);
        backupFiles.forEach((file, index) => {
          if (index < 5) {
            const filePath = path.join(uploadsPath, file);
            const fileStats = fs.statSync(filePath);
            console.log(`     ${index + 1}. ${file} (${fileStats.isDirectory() ? 'DIR' : 'FILE'}, ${fileStats.size} bytes)`);
          }
        });
      } catch (backupListError) {
        console.error(`📍 ERROR listando backup:`, backupListError);
      }
      
      console.log('🔍 === FIN DIAGNÓSTICO ===');
      
      // 🗑️ ELIMINACIÓN CONTROLADA DE ARCHIVOS EXISTENTES
      if (fs.existsSync(targetUploadsDir)) {
        console.log('🗑️ Eliminando archivos uploads actuales completamente...');
        
        try {
          // Método super detallado para debugging
          const removeContentsDetailed = (dirPath: string, depth = 0) => {
            const indent = '  '.repeat(depth);
            console.log(`${indent}🔍 Procesando: ${dirPath}`);
            
            if (!fs.existsSync(dirPath)) {
              console.log(`${indent}⚠️ Directorio no existe`);
              return;
            }
            
            let files;
            try {
              files = fs.readdirSync(dirPath);
              console.log(`${indent}📋 Encontrados ${files.length} elementos`);
            } catch (readError) {
              console.error(`${indent}❌ Error leyendo directorio: ${readError}`);
              throw readError;
            }
            
            for (const file of files) {
              const filePath = path.join(dirPath, file);
              console.log(`${indent}📄 Procesando: ${file}`);
              
              try {
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                  console.log(`${indent}📁 Es directorio, recursando...`);
                  removeContentsDetailed(filePath, depth + 1);
                  
                  try {
                    fs.rmdirSync(filePath);
                    console.log(`${indent}✅ Directorio eliminado: ${file}`);
                  } catch (rmDirError) {
                    console.error(`${indent}❌ Error eliminando directorio ${file}:`, rmDirError);
                    throw rmDirError;
                  }
                } else {
                  try {
                    fs.unlinkSync(filePath);
                    console.log(`${indent}✅ Archivo eliminado: ${file} (${stats.size} bytes)`);
                  } catch (unlinkError) {
                    console.error(`${indent}❌ Error eliminando archivo ${file}:`, unlinkError);
                    throw unlinkError;
                  }
                }
              } catch (statError) {
                console.error(`${indent}❌ Error obteniendo stats de ${file}:`, statError);
                throw statError;
              }
            }
          };
          
          removeContentsDetailed(targetUploadsDir);
          console.log('✅ Eliminación completada exitosamente');
          
        } catch (removeError) {
          console.error('❌ ERROR CRÍTICO EN ELIMINACIÓN:');
          console.error(`   Tipo: ${removeError instanceof Error ? removeError.constructor.name : typeof removeError}`);
          console.error(`   Mensaje: ${removeError instanceof Error ? removeError.message : String(removeError)}`);
          console.error(`   Código: ${(removeError as any)?.code || 'N/A'}`);
          console.error(`   Stack:`, removeError instanceof Error ? removeError.stack : 'N/A');
          
          // Intentar diagnóstico adicional
          try {
            console.log('🔍 Diagnóstico adicional después del error:');
            const postErrorStats = fs.statSync(targetUploadsDir);
            console.log(`   Directorio aún existe - Permisos: ${postErrorStats.mode.toString(8)}`);
            
            if (process.platform !== 'win32') {
              const { stdout: lsOutput } = await execAsync(`ls -la "${targetUploadsDir}"`);
              console.log(`   Contenido (ls -la):\n${lsOutput}`);
            }
          } catch (diagError) {
            console.error(`   Error en diagnóstico adicional:`, diagError);
          }
          
          throw new Error(`Error eliminando archivos uploads: ${removeError instanceof Error ? removeError.message : String(removeError)} (${removeError instanceof Error ? removeError.constructor.name : typeof removeError})`);
        }
      }
      
      // 📁 RECREACIÓN DE ESTRUCTURA
      console.log('📂 Recreando estructura de directorios...');
      const requiredDirs = [
        targetUploadsDir,
        path.join(targetUploadsDir, 'songs'),
        path.join(targetUploadsDir, 'events'),  
        path.join(targetUploadsDir, 'audio'),
        path.join(targetUploadsDir, 'images'),
        path.join(targetUploadsDir, 'images', 'profiles'),
        path.join(targetUploadsDir, 'images', 'playlists')
      ];
      
      for (const dir of requiredDirs) {
        try {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`   ✅ Creado: ${path.relative(targetUploadsDir, dir) || 'raíz'}`);
          } else {
            console.log(`   ℹ️ Ya existe: ${path.relative(targetUploadsDir, dir) || 'raíz'}`);
          }
        } catch (mkdirError) {
          console.error(`   ❌ Error creando ${dir}:`, mkdirError);
          throw mkdirError;
        }
      }
      
      // 📋 COPIA DE ARCHIVOS CON MONITOREO DETALLADO
      console.log('📋 Iniciando copia de archivos con monitoreo detallado...');
      const copyDirDetailed = (src: string, dest: string, depth = 0): number => {
        const indent = '  '.repeat(depth);
        let count = 0;
        
        console.log(`${indent}📂 Copiando: ${src} → ${dest}`);
        
        try {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
            console.log(`${indent}📁 Destino creado`);
          }
          
          const files = fs.readdirSync(src);
          console.log(`${indent}📋 Elementos a copiar: ${files.length}`);
          
          for (const file of files) {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            
            try {
              const srcStats = fs.statSync(srcFile);
              
              if (srcStats.isDirectory()) {
                console.log(`${indent}📁 Copiando directorio: ${file}`);
                count += copyDirDetailed(srcFile, destFile, depth + 1);
              } else {
                console.log(`${indent}📄 Copiando archivo: ${file} (${srcStats.size} bytes)`);
                fs.copyFileSync(srcFile, destFile);
                
                // Verificar que se copió correctamente
                if (fs.existsSync(destFile)) {
                  const destStats = fs.statSync(destFile);
                  if (destStats.size === srcStats.size) {
                    console.log(`${indent}   ✅ Verificado (${destStats.size} bytes)`);
                  } else {
                    console.log(`${indent}   ⚠️ Tamaño difiere: origen=${srcStats.size}, destino=${destStats.size}`);
                  }
                } else {
                  console.log(`${indent}   ❌ Archivo no se creó en destino`);
                }
                count++;
              }
            } catch (fileError) {
              console.error(`${indent}❌ Error copiando ${file}:`, fileError);
              throw fileError;
            }
          }
        } catch (dirError) {
          console.error(`${indent}❌ Error procesando directorio:`, dirError);
          throw dirError;
        }
        
        console.log(`${indent}✅ Completado: ${count} archivos`);
        return count;
      };
      
      filesRestored = copyDirDetailed(uploadsPath, targetUploadsDir);
      
      // 🔍 VERIFICACIÓN FINAL
      console.log('🔍 Verificación final de archivos restaurados...');
      const restoredProfileImagesDir = path.join(targetUploadsDir, 'images', 'profiles');
      if (fs.existsSync(restoredProfileImagesDir)) {
        const profileImages = fs.readdirSync(restoredProfileImagesDir);
        console.log(`✅ ${filesRestored} archivos restaurados (incluyendo ${profileImages.length} imágenes de perfil)`);
      } else {
        console.log(`✅ ${filesRestored} archivos restaurados (sin imágenes de perfil)`);
      }
      
      // 🔧 AJUSTE DE PERMISOS
      if (process.platform !== 'win32') {
        try {
          console.log('🔧 Ajustando permisos...');
          await execAsync(`chmod -R 755 "${targetUploadsDir}"`);
          console.log('✅ Permisos ajustados a 755');
        } catch (permError) {
          console.warn('⚠️ No se pudieron ajustar permisos:', permError);
        }
      }
      
    } catch (filesError) {
      console.error('❌ === ERROR CRÍTICO EN RESTAURACIÓN DE ARCHIVOS ===');
      console.error(`🔍 Tipo de error: ${filesError instanceof Error ? filesError.constructor.name : typeof filesError}`);
      console.error(`🔍 Mensaje: ${filesError instanceof Error ? filesError.message : String(filesError)}`);
      console.error(`🔍 Código: ${(filesError as any)?.code || 'N/A'}`);
      console.error(`🔍 Stack completo:`);
      console.error(filesError instanceof Error ? filesError.stack : 'N/A');
      
      // Información adicional del sistema en caso de error
      try {
        console.error(`🔍 Working directory: ${process.cwd()}`);
        console.error(`🔍 Available space check...`);
        if (process.platform !== 'win32') {
          const { stdout: dfOutput } = await execAsync(`df -h "${projectRoot}"`);
          console.error(`🔍 Disk usage:\n${dfOutput}`);
        }
      } catch (sysError) {
        console.error(`🔍 Error obteniendo info del sistema:`, sysError);
      }
      
      throw new Error(`Error crítico en restauración de archivos: ${filesError instanceof Error ? filesError.message : String(filesError)} (${filesError instanceof Error ? filesError.constructor.name : typeof filesError}). Ver logs detallados arriba.`);
    }

    // 6. Limpiar archivos temporales
    console.log('🧹 Limpiando archivos temporales...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    console.log('✅ Archivos temporales eliminados');

    // 7. Verificar integridad final
    const finalStats = {
      users: await prisma.user.count(),
      songs: await prisma.song.count(),
      playlists: await prisma.playlist.count(),
      events: await prisma.event.count()
    };

    console.log('🎉 Backup restaurado exitosamente');
    console.log('📊 Estadísticas finales:', finalStats);

    // Restaurar timeout original
    req.socket.setTimeout(originalTimeout);

    res.json({
      success: true,
      message: 'Backup restaurado exitosamente',
      info: {
        ...backupInfo,
        restoredStats: finalStats,
        filesRestored
      }
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    
    // Restaurar timeout original en caso de error
    req.socket.setTimeout(originalTimeout);
    
    res.status(500).json({ 
      error: 'Error restaurando backup',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Obtener información del sistema para el frontend
router.get('/system-info', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalPlaylists,
      totalEvents,
      totalSongs,        // Canciones principales (voiceType = null)
      totalAudioFiles,   // Archivos de audio (voiceType != null)
      usersWithProfileImagesCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.playlist.count(),
      prisma.event.count(),
      prisma.song.count({
        where: { voiceType: null }  // Solo canciones principales
      }),
      prisma.song.count({
        where: { voiceType: { not: null } }  // Solo archivos de audio (variaciones)
      }),
      prisma.user.count({ 
        where: { profileImage: { not: null } } 
      } as any) // Temporal hasta que se recargue el TypeScript
    ]);

    // Calcular tamaño del directorio uploads (backend/uploads)
    const uploadsDir = path.join(projectRoot, 'backend', 'uploads');
    let storageUsed = 0;
    
    // Calcular tamaño específico del directorio de imágenes de perfil
    const profileImagesDir = path.join(uploadsDir, 'images', 'profiles');
    let profileStorageUsed = 0;
    let profileImagesCount = 0;
    
    const calculateDirSize = (dirPath: string): number => {
      if (!fs.existsSync(dirPath)) return 0;
      let size = 0;
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          size += calculateDirSize(filePath);
        } else {
          size += stats.size;
        }
      }
      return size;
    };

    storageUsed = calculateDirSize(uploadsDir);
    const storageMB = (storageUsed / (1024 * 1024)).toFixed(2);
    
    if (fs.existsSync(profileImagesDir)) {
      profileStorageUsed = calculateDirSize(profileImagesDir);
      profileImagesCount = fs.readdirSync(profileImagesDir).length;
    }
    const profileStorageMB = (profileStorageUsed / (1024 * 1024)).toFixed(2);

    res.json({
      totalUsers,
      totalSongs,           // Canciones principales
      totalAudioFiles,      // Archivos de audio/variaciones
      totalPlaylists,
      totalEvents,
      usersWithProfileImages: usersWithProfileImagesCount,
      profileImages: {
        count: profileImagesCount,
        storageUsed: `${profileStorageMB} MB`,
        storageBytes: profileStorageUsed
      },
      storageUsed: `${storageMB} MB`,
      storageBytes: storageUsed
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ error: 'Error obteniendo información del sistema' });
  }
});

export default router;
