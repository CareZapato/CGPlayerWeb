-- Inicialización de la base de datos para CGPlayerWeb
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar timezone
SET timezone = 'America/Santiago';

-- Crear índices adicionales para mejor rendimiento (se aplicarán después de las migraciones)
-- Estos son solo para referencia, las tablas se crearán con Prisma
