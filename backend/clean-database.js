#!/usr/bin/env node

/**
 * Script para limpiar migraciones conflictivas y resetear la base de datos
 * Se ejecuta antes de la inicialización para evitar errores de migración
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧹 Iniciando limpieza de base de datos y migraciones...');

try {
  // Cambiar al directorio backend
  const backendDir = path.join(__dirname, '..');
  process.chdir(backendDir);
  
  console.log('📁 Directorio de trabajo:', process.cwd());
  
  // Paso 1: Limpiar completamente la base de datos
  console.log('🔄 Paso 1: Limpiando base de datos...');
  try {
    execSync('npx prisma db push --force-reset', {
      stdio: 'pipe',
      timeout: 30000
    });
    console.log('✅ Base de datos limpiada');
  } catch (error) {
    console.log('⚠️ Error en limpieza de DB (puede ser normal si no existe)');
  }
  
  // Paso 2: Regenerar cliente Prisma
  console.log('🔄 Paso 2: Regenerando cliente Prisma...');
  try {
    execSync('npx prisma generate', {
      stdio: 'pipe',
      timeout: 15000
    });
    console.log('✅ Cliente Prisma regenerado');
  } catch (error) {
    console.log('⚠️ Error regenerando cliente (continuando...)');
  }
  
  // Paso 3: Aplicar schema actual
  console.log('🔄 Paso 3: Aplicando schema actual...');
  try {
    execSync('npx prisma db push', {
      stdio: 'pipe',
      timeout: 20000
    });
    console.log('✅ Schema aplicado exitosamente');
  } catch (error) {
    console.log('❌ Error aplicando schema:', error.message);
    process.exit(1);
  }
  
  console.log('🎉 Limpieza completada exitosamente');
  console.log('💡 La aplicación puede iniciarse normalmente ahora');

} catch (error) {
  console.error('❌ Error durante la limpieza:', error.message);
  process.exit(1);
}
