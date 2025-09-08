const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIsPrimaryColumn() {
  try {
    console.log('🔧 Agregando columna isPrimary a user_voice_profiles...');
    
    // Agregar la columna si no existe
    await prisma.$executeRaw`
      ALTER TABLE user_voice_profiles 
      ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE;
    `;
    
    console.log('✅ Columna isPrimary agregada exitosamente');
    
    // Verificar la estructura
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_voice_profiles';
    `;
    
    console.log('📋 Estructura actual de user_voice_profiles:');
    console.table(result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addIsPrimaryColumn();
