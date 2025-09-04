import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class DatabaseInitializationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private async checkConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Conexión a base de datos establecida');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a base de datos:', error);
      return false;
    }
  }

  private async checkTablesExist(): Promise<boolean> {
    try {
      // Intentar hacer consultas simples a las tablas principales
      const userCount = await this.prisma.user.count();
      const locationCount = await this.prisma.location.count();
      console.log(`🔍 Tablas verificadas: ${userCount} usuarios, ${locationCount} ubicaciones`);
      return true;
    } catch (error) {
      console.log('🔍 Tablas no encontradas o error de conexión:', error);
      return false;
    }
  }

  async getDatabaseStatus() {
    try {
      const [users, locations, admins] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.location.count(),
        this.prisma.userRole_DB.count({
          where: { 
            OR: [
              { role: 'ADMIN' },
              { role: 'DIRECTOR' }
            ]
          }
        })
      ]);

      return { users, locations, admins };
    } catch (error) {
      console.log('📊 Error obteniendo estadísticas:', error);
      return { users: 0, locations: 0, admins: 0 };
    }
  }

  private async createTables(): Promise<boolean> {
    try {
      console.log('🔨 Creando estructura de base de datos...');
      
      try {
        console.log('📋 Intentando aplicar migraciones existentes...');
        execSync('npx prisma migrate deploy', { 
          cwd: process.cwd(),
          stdio: 'ignore'
        });
        console.log('✅ Migraciones aplicadas exitosamente');
        return true;
      } catch (migrateError) {
        console.log('⚠️ Migrate falló, intentando db push...');
        
        try {
          execSync('npx prisma db push --force-reset', { 
            cwd: process.cwd(),
            stdio: 'ignore'
          });
          console.log('✅ DB Push completado exitosamente');
          return true;
        } catch (pushError) {
          console.error('❌ Error en db push:', pushError);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error creando tablas:', error);
      return false;
    }
  }

  private async createMinimalSeedData(): Promise<boolean> {
    try {
      console.log('🌱 Creando datos mínimos de inicialización...');

      // Verificar si ya existe el admin
      const existingAdmin = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: 'admin@cgplayer.local' },
            { username: 'admin_principal' }
          ]
        }
      });

      if (existingAdmin) {
        console.log('👤 Usuario administrador ya existe');
        return true;
      }

      // Crear ubicación principal si no existe
      let santiagoLocation = await this.prisma.location.findFirst({
        where: { name: 'Santiago Centro' }
      });

      if (!santiagoLocation) {
        santiagoLocation = await this.prisma.location.create({
          data: {
            name: 'Santiago Centro',
            city: 'Santiago',
            region: 'Metropolitana',
            country: 'Chile',
            type: 'SANTIAGO'
          }
        });
      }

      // Crear usuario administrador
      const hashedPassword = await bcrypt.hash('cgplayer2025', 10);
      
      const adminUser = await this.prisma.user.create({
        data: {
          firstName: 'Administrador',
          lastName: 'Principal',
          email: 'admin@cgplayer.local',
          username: 'admin_principal',
          password: hashedPassword,
          locationId: santiagoLocation.id,
          isActive: true
        }
      });

      // Asignar rol de administrador
      await this.prisma.userRole_DB.create({
        data: {
          userId: adminUser.id,
          role: 'ADMIN'
        }
      });

      console.log('✅ Datos mínimos creados exitosamente');
      console.log('👤 Usuario administrador creado:');
      console.log('   📧 Email: admin@cgplayer.local');
      console.log('   🔑 Password: cgplayer2025');
      console.log('   📍 Ubicación: Santiago Centro, Chile');

      return true;
    } catch (error) {
      console.error('❌ Error creando datos mínimos:', error);
      return false;
    }
  }

  async initializeDatabase(): Promise<{
    success: boolean;
    message: string;
    tablesCreated?: boolean;
    userCreated?: boolean;
    error?: string;
  }> {
    try {
      console.log('🚀 Iniciando verificación de base de datos...');

      // 1. Verificar conexión
      const connectionOk = await this.checkConnection();
      if (!connectionOk) {
        return {
          success: false,
          message: 'No se pudo conectar a la base de datos',
          error: 'Database connection failed'
        };
      }

      // 2. Verificar si las tablas existen
      const tablesExist = await this.checkTablesExist();
      let tablesCreated = false;

      if (!tablesExist) {
        console.log('⚠️ Tablas no encontradas o incompletas, creando estructura...');
        const tablesCreationResult = await this.createTables();
        
        if (!tablesCreationResult) {
          return {
            success: false,
            message: 'No se pudo crear la estructura de base de datos',
            error: 'Table creation failed'
          };
        }
        
        tablesCreated = true;
        
        // Verificar nuevamente después de crear las tablas
        const tablesExistAfterCreation = await this.checkTablesExist();
        if (!tablesExistAfterCreation) {
          return {
            success: false,
            message: 'Las tablas aún no están disponibles después del intento de creación',
            error: 'Tables still not accessible after creation attempt'
          };
        }
      }

      // 3. Verificar si existe usuario administrador
      const adminExists = await this.prisma.userRole_DB.findFirst({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'DIRECTOR' }
          ]
        }
      });

      let userCreated = false;
      if (!adminExists) {
        console.log('👤 Usuario administrador no encontrado, creando datos mínimos...');
        const seedResult = await this.createMinimalSeedData();
        
        if (!seedResult) {
          return {
            success: false,
            message: 'No se pudieron crear los datos iniciales',
            error: 'Initial data creation failed'
          };
        }
        
        userCreated = true;
      }

      return {
        success: true,
        message: 'Inicialización de base de datos completada',
        tablesCreated,
        userCreated
      };

    } catch (error: any) {
      console.error('❌ Error durante la inicialización:', error);
      return {
        success: false,
        message: 'Error inesperado durante la inicialización',
        error: error.message || error.toString()
      };
    }
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

export default DatabaseInitializationService;
