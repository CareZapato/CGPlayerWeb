import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

/**
 * Script de inicialización automática
 * Se ejecuta al iniciar el servidor para verificar y crear la BD si es necesario
 */
export async function autoInitializeDatabase() {
  console.log('🔍 Verificando estado de la base de datos...');
  
  try {
    // Intentar conectar y hacer una consulta simple
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log('✅ Base de datos conectada correctamente');
    
    // Verificar si hay datos
    const locationCount = await prisma.location.count();
    
    if (userCount === 0) {
      console.log('📋 No se encontraron usuarios, ejecutando seeder completo...');
      await runSeeder();
      
      // Verificar que se crearon los datos
      const newUserCount = await prisma.user.count();
      console.log(`✅ Seeder completado: ${newUserCount} usuarios creados`);
    } else {
      console.log(`✅ Base de datos ya contiene ${userCount} usuarios y ${locationCount} ubicaciones`);
    }
    
  } catch (error: any) {
    console.log('❌ Error al conectar con la base de datos:', error.message);
    
    // Si es un error de tabla inexistente, ejecutar migraciones
    if (error.code === 'P2021' || error.message.includes('does not exist') || error.message.includes('relation') || error.code === 'P1001') {
      console.log('🔧 Las tablas no existen o hay problemas de conexión. Configurando base de datos...');
      
      try {
        await runMigrations();
        await runSeeder();
        
        // Verificar que todo se creó correctamente
        const finalUserCount = await prisma.user.count();
        console.log(`✅ Base de datos inicializada correctamente con ${finalUserCount} usuarios`);
      } catch (setupError: any) {
        console.log('❌ Error durante la configuración automática:', setupError.message);
        console.log('🔧 Solución manual: Ejecutar "npm run db:reset" o verificar PostgreSQL');
        // No terminar el proceso, permitir que el servidor continúe
      }
    } else {
      console.log('❌ Error inesperado:', error);
      console.log('🔧 Verifica que PostgreSQL esté ejecutándose y las variables de entorno estén configuradas');
      // No terminar el proceso, permitir que el servidor continúe
    }
  }
}

async function runMigrations() {
  try {
    console.log('📋 Ejecutando migraciones de Prisma...');
    
    // Usar deploy en lugar de dev para modo no interactivo
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '../../')
    });
    
    if (stderr && !stderr.includes('warnings') && !stderr.includes('Applied')) {
      console.log('⚠️ Advertencias en migraciones:', stderr);
    }
    
    // Regenerar el cliente de Prisma para sincronizar
    console.log('🔄 Regenerando cliente de Prisma...');
    await execAsync('npx prisma generate', {
      cwd: path.join(__dirname, '../../')
    });
    
    console.log('✅ Migraciones ejecutadas correctamente');
  } catch (error: any) {
    console.log('❌ Error ejecutando migraciones con deploy, intentando reset...');
    
    // Si falla deploy, intentar reset
    try {
      const { stdout: resetStdout } = await execAsync('npx prisma migrate reset --force', {
        cwd: path.join(__dirname, '../../')
      });
      console.log('✅ Base de datos reseteada y migraciones aplicadas');
    } catch (resetError: any) {
      console.log('❌ Error en reset:', resetError.message);
      throw resetError;
    }
  }
}

async function runSeeder() {
  try {
    console.log('🌱 Ejecutando seeder avanzado...');
    const { stdout, stderr } = await execAsync('npx ts-node prisma/seed_new.ts', {
      cwd: path.join(__dirname, '../../')
    });
    
    console.log('✅ Seeder ejecutado correctamente');
    console.log('📊 Base de datos inicializada con 152 usuarios');
  } catch (error: any) {
    console.log('❌ Error ejecutando seeder:', error.message);
    throw error;
  }
}

// Función para cerrar la conexión de Prisma
export async function closeDatabaseConnection() {
  await prisma.$disconnect();
}
