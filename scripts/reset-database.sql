-- Script para eliminar todas las tablas de CGPlayerWeb manteniendo la base de datos
-- EJECUTAR EN DBeaver después de conectarse a la BD

-- 1. Ver todas las tablas existentes (opcional)
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 2. Generar comandos DROP para todas las tablas
SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as drop_command
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Eliminar todas las tablas (CUIDADO: esto borra todo)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las tablas del esquema public
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Eliminar todas las secuencias
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Eliminar todos los tipos enum personalizados
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;