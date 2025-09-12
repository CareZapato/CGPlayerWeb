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
        
        // PASO 3: RESTAURAR DATOS
        console.log('📥 INICIANDO RESTAURACIÓN DE DATOS...');
        let totalRestored = 0;
        
        // Tablas padre primero (sin dependencias)
        if (data.locations?.length > 0) {
          await tx.location.createMany({ data: data.locations });
          console.log(`✅ ${data.locations.length} ubicaciones restauradas`);
          totalRestored += data.locations.length;
        }
        
        if (data.users?.length > 0) {
          await tx.user.createMany({ data: data.users });
          console.log(`✅ ${data.users.length} usuarios restaurados`);
          totalRestored += data.users.length;
        }
        
        if (data.userRoles?.length > 0) {
          await tx.userRole_DB.createMany({ data: data.userRoles });
          console.log(`✅ ${data.userRoles.length} roles de usuario restaurados`);
          totalRestored += data.userRoles.length;
        }
        
        if (data.userVoiceProfiles?.length > 0) {
          await tx.userVoiceProfile.createMany({ data: data.userVoiceProfiles });
          console.log(`✅ ${data.userVoiceProfiles.length} perfiles de voz restaurados`);
          totalRestored += data.userVoiceProfiles.length;
        }
        
        if (data.songs?.length > 0) {
          await tx.song.createMany({ data: data.songs });
          console.log(`✅ ${data.songs.length} canciones restauradas`);
          totalRestored += data.songs.length;
        }
        
        if (data.lyricsFiles?.length > 0) {
          await tx.lyricsFile.createMany({ data: data.lyricsFiles });
          console.log(`✅ ${data.lyricsFiles.length} archivos de letras restaurados`);
          totalRestored += data.lyricsFiles.length;
        }
        
        if (data.lyrics?.length > 0) {
          await tx.lyric.createMany({ data: data.lyrics });
          console.log(`✅ ${data.lyrics.length} letras restauradas`);
          totalRestored += data.lyrics.length;
        }
        
        if (data.songAssignments?.length > 0) {
          await tx.songAssignment.createMany({ data: data.songAssignments });
          console.log(`✅ ${data.songAssignments.length} asignaciones de canciones restauradas`);
          totalRestored += data.songAssignments.length;
        }
        
        if (data.playlists?.length > 0) {
          await tx.playlist.createMany({ data: data.playlists });
          console.log(`✅ ${data.playlists.length} playlists restauradas`);
          totalRestored += data.playlists.length;
        }
        
        if (data.playlistItems?.length > 0) {
          await tx.playlistItem.createMany({ data: data.playlistItems });
          console.log(`✅ ${data.playlistItems.length} elementos de playlist restaurados`);
          totalRestored += data.playlistItems.length;
        }
        
        if (data.events?.length > 0) {
          await tx.event.createMany({ data: data.events });
          console.log(`✅ ${data.events.length} eventos restaurados`);
          totalRestored += data.events.length;
        }
        
        if (data.eventPlaylists?.length > 0) {
          await tx.eventPlaylist.createMany({ data: data.eventPlaylists });
          console.log(`✅ ${data.eventPlaylists.length} playlists de eventos restauradas`);
          totalRestored += data.eventPlaylists.length;
        }
        
        if (data.eventAttendees?.length > 0) {
          await tx.eventAttendee.createMany({ data: data.eventAttendees });
          console.log(`✅ ${data.eventAttendees.length} asistentes a eventos restaurados`);
          totalRestored += data.eventAttendees.length;
        }
        
        if (data.eventJoinRequests?.length > 0) {
          await tx.eventJoinRequest.createMany({ data: data.eventJoinRequests });
          console.log(`✅ ${data.eventJoinRequests.length} solicitudes de eventos restauradas`);
          totalRestored += data.eventJoinRequests.length;
        }
        
        if (data.eventSongs?.length > 0) {
          await tx.eventSong.createMany({ data: data.eventSongs });
          console.log(`✅ ${data.eventSongs.length} canciones de eventos restauradas`);
          totalRestored += data.eventSongs.length;
        }
        
        if (data.eventAttendance?.length > 0) {
          await tx.eventAttendance.createMany({ data: data.eventAttendance });
          console.log(`✅ ${data.eventAttendance.length} asistencias a eventos restauradas`);
          totalRestored += data.eventAttendance.length;
        }
        
        if (data.soloists?.length > 0) {
          await tx.soloist.createMany({ data: data.soloists });
          console.log(`✅ ${data.soloists.length} solistas restaurados`);
          totalRestored += data.soloists.length;
        }
        
        if (data.news?.length > 0) {
          await tx.news.createMany({ data: data.news });
          console.log(`✅ ${data.news.length} noticias restauradas`);
          totalRestored += data.news.length;
        }
        
        console.log(`🎉 RESTAURACIÓN DE BASE DE DATOS COMPLETADA: ${totalRestored} registros totales`);
      });
      
      // PASO 4: VERIFICAR RESULTADOS FINALES
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
    console.log('📁 Iniciando restauración de archivos...');
    let filesRestored = 0;
    if (fs.existsSync(uploadsPath)) {
      const targetUploadsDir = path.join(projectRoot, 'backend', 'uploads');
      
      // Eliminar archivos uploads actuales de forma más segura para VPS
      if (fs.existsSync(targetUploadsDir)) {
        console.log('🗑️ Eliminando archivos uploads actuales...');
        try {
          // Método más seguro: eliminar contenido en lugar del directorio completo
          const removeContents = (dirPath: string) => {
            if (!fs.existsSync(dirPath)) return;
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
              const filePath = path.join(dirPath, file);
              const stats = fs.statSync(filePath);
              if (stats.isDirectory()) {
                removeContents(filePath);
                try {
                  fs.rmdirSync(filePath);
                } catch (err) {
                  console.warn(`⚠️ No se pudo eliminar directorio ${filePath}:`, err);
                }
              } else {
                try {
                  fs.unlinkSync(filePath);
                } catch (err) {
                  console.warn(`⚠️ No se pudo eliminar archivo ${filePath}:`, err);
                }
              }
            }
          };
          
          removeContents(targetUploadsDir);
          console.log('✅ Contenido de uploads eliminado');
        } catch (error) {
          console.warn('⚠️ Error eliminando archivos uploads (continuando):', error);
          // No lanzar error, continuar con la restauración
        }
      }
      
      // Asegurar que el directorio base existe
      if (!fs.existsSync(targetUploadsDir)) {
        fs.mkdirSync(targetUploadsDir, { recursive: true });
        console.log('📁 Directorio uploads recreado');
      }
      
      // Copiar nuevos archivos con manejo de errores mejorado
      const copyDir = (src: string, dest: string): number => {
        let count = 0;
        try {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          
          const files = fs.readdirSync(src);
          for (const file of files) {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            
            try {
              if (fs.statSync(srcFile).isDirectory()) {
                count += copyDir(srcFile, destFile);
              } else {
                fs.copyFileSync(srcFile, destFile);
                count++;
              }
            } catch (fileError) {
              console.warn(`⚠️ Error copiando ${srcFile}:`, fileError);
            }
          }
        } catch (dirError) {
          console.warn(`⚠️ Error procesando directorio ${src}:`, dirError);
        }
        return count;
      };
      
      try {
        filesRestored = copyDir(uploadsPath, targetUploadsDir);
        
        // Verificar restauración específica de imágenes de perfil
        const restoredProfileImagesDir = path.join(targetUploadsDir, 'images', 'profiles');
        if (fs.existsSync(restoredProfileImagesDir)) {
          const profileImages = fs.readdirSync(restoredProfileImagesDir);
          console.log(`✅ ${filesRestored} archivos restaurados (incluyendo ${profileImages.length} imágenes de perfil)`);
        } else {
          console.log(`✅ ${filesRestored} archivos restaurados`);
        }
        
        // Verificar permisos después de la copia
        try {
          if (process.platform !== 'win32') {
            await execAsync(`chmod -R 755 "${targetUploadsDir}"`);
            console.log('✅ Permisos de archivos ajustados');
          }
        } catch (permError) {
          console.warn('⚠️ No se pudieron ajustar permisos:', permError);
        }
      } catch (copyError) {
        console.error('❌ Error durante la copia de archivos:', copyError);
        throw new Error('Error copiando archivos: ' + (copyError instanceof Error ? copyError.message : 'Error desconocido'));
      }
    } else {
      console.log('ℹ️ No hay archivos para restaurar');
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
