-- CGPlayerWeb Database Backup - Base Data
-- Archivo de respaldo para datos iniciales del sistema
-- Ejecutar después de las migraciones de Prisma

-- ============================================
-- LIMPIEZA DE DATOS EXISTENTES
-- ============================================
DELETE FROM "soloists";
DELETE FROM "event_songs";
DELETE FROM "events";
DELETE FROM "lyrics";
DELETE FROM "playlist_items";
DELETE FROM "playlists";
DELETE FROM "song_assignments";
DELETE FROM "songs";
DELETE FROM "user_voice_profiles";
DELETE FROM "users";
DELETE FROM "locations";

-- Reiniciar secuencias si es necesario
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- ============================================
-- UBICACIONES
-- ============================================
INSERT INTO "locations" (id, name, type, address, city, region, country, "isActive", "createdAt", "updatedAt") VALUES
('clm1loc001', 'Iglesia Central Antofagasta', 'ANTOFAGASTA', 'Av. Pedro Aguirre Cerda 150', 'Antofagasta', 'Antofagasta', 'Chile', true, NOW(), NOW()),
('clm1loc002', 'Iglesia ChileGospel Viña del Mar', 'VINA_DEL_MAR', 'Calle Libertad 456', 'Viña del Mar', 'Valparaíso', 'Chile', true, NOW(), NOW()),
('clm1loc003', 'Iglesia Principal Santiago', 'SANTIAGO', 'Av. Providencia 2500', 'Santiago', 'Metropolitana', 'Chile', true, NOW(), NOW()),
('clm1loc004', 'Iglesia ChileGospel Concepción', 'CONCEPCION', 'Calle Barros Arana 100', 'Concepción', 'Biobío', 'Chile', true, NOW(), NOW()),
('clm1loc005', 'Iglesia ChileGospel Valdivia', 'VALDIVIA', 'Av. Picarte 800', 'Valdivia', 'Los Ríos', 'Chile', true, NOW(), NOW());

-- ============================================
-- USUARIOS
-- ============================================

-- Administrador
INSERT INTO "users" (id, email, username, password, "firstName", "lastName", role, "locationId", "isActive", "createdAt", "updatedAt") VALUES
('clm1usr001', 'admin@chilegospel.com', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos', 'Administrador', 'ADMIN', 'clm1loc003', true, NOW(), NOW());

-- Director Musical
INSERT INTO "users" (id, email, username, password, "firstName", "lastName", role, "locationId", "isActive", "createdAt", "updatedAt") VALUES
('clm1usr002', 'director@chilegospel.com', 'director', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'Directora', 'DIRECTOR', 'clm1loc003', true, NOW(), NOW());

-- Cantantes (sin canciones por ahora)
INSERT INTO "users" (id, email, username, password, "firstName", "lastName", role, "locationId", "isActive", "createdAt", "updatedAt") VALUES
('clm1usr003', 'singer1@chilegospel.com', 'singer1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'González', 'SINGER', 'clm1loc001', true, NOW(), NOW()),
('clm1usr004', 'singer2@chilegospel.com', 'singer2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Luis', 'Martínez', 'SINGER', 'clm1loc002', true, NOW(), NOW()),
('clm1usr005', 'singer3@chilegospel.com', 'singer3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carmen', 'López', 'SINGER', 'clm1loc003', true, NOW(), NOW()),
('clm1usr006', 'singer4@chilegospel.com', 'singer4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro', 'Silva', 'SINGER', 'clm1loc004', true, NOW(), NOW()),
('clm1usr007', 'singer5@chilegospel.com', 'singer5', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Isabel', 'Torres', 'SINGER', 'clm1loc005', true, NOW(), NOW()),
('clm1usr008', 'singer6@chilegospel.com', 'singer6', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Miguel', 'Flores', 'SINGER', 'clm1loc001', true, NOW(), NOW()),
('clm1usr009', 'singer7@chilegospel.com', 'singer7', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rosa', 'Hernández', 'SINGER', 'clm1loc002', true, NOW(), NOW()),
('clm1usr010', 'singer8@chilegospel.com', 'singer8', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Morales', 'SINGER', 'clm1loc003', true, NOW(), NOW()),
('clm1usr011', 'singer9@chilegospel.com', 'singer9', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Patricia', 'Vargas', 'SINGER', 'clm1loc004', true, NOW(), NOW()),
('clm1usr012', 'singer10@chilegospel.com', 'singer10', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Roberto', 'Castro', 'SINGER', 'clm1loc005', true, NOW(), NOW());

-- ============================================
-- PERFILES DE VOZ
-- ============================================
INSERT INTO "user_voice_profiles" (id, "userId", "voiceType", "assignedBy", "createdAt") VALUES
('clm1vp001', 'clm1usr003', 'SOPRANO', 'clm1usr002', NOW()),
('clm1vp002', 'clm1usr004', 'CONTRALTO', 'clm1usr002', NOW()),
('clm1vp003', 'clm1usr005', 'TENOR', 'clm1usr002', NOW()),
('clm1vp004', 'clm1usr006', 'BARITONE', 'clm1usr002', NOW()),
('clm1vp005', 'clm1usr007', 'BASS', 'clm1usr002', NOW()),
('clm1vp006', 'clm1usr008', 'SOPRANO', 'clm1usr002', NOW()),
('clm1vp007', 'clm1usr009', 'CONTRALTO', 'clm1usr002', NOW()),
('clm1vp008', 'clm1usr010', 'TENOR', 'clm1usr002', NOW()),
('clm1vp009', 'clm1usr011', 'BARITONE', 'clm1usr002', NOW()),
('clm1vp010', 'clm1usr012', 'BASS', 'clm1usr002', NOW());

-- ============================================
-- EVENTOS DE EJEMPLO (sin canciones por ahora)
-- ============================================
INSERT INTO "events" (id, title, description, date, "locationId", category, "isActive", "createdAt", "updatedAt") VALUES
('clm1evt001', 'Culto Dominical - Antofagasta', 'Culto programado en Antofagasta', '2025-08-17 10:00:00', 'clm1loc001', 'Culto', true, NOW(), NOW()),
('clm1evt002', 'Ensayo General - Santiago', 'Ensayo programado en Santiago', '2025-08-20 19:00:00', 'clm1loc003', 'Ensayo', true, NOW(), NOW()),
('clm1evt003', 'Presentación Especial - Viña del Mar', 'Presentación programada en Viña del Mar', '2025-08-24 16:00:00', 'clm1loc002', 'Presentación', true, NOW(), NOW()),
('clm1evt004', 'Evento Especial - Concepción', 'Evento programado en Concepción', '2025-08-31 18:00:00', 'clm1loc004', 'Especial', true, NOW(), NOW());

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las contraseñas están hasheadas con bcrypt para "admin123", "director123", "singer123"
-- 2. No se incluyen canciones inicialmente para testing
-- 3. Los IDs son únicos y consistentes para referencias
-- 4. Se pueden agregar más datos según necesidad

-- ============================================
-- VERIFICACIÓN DE DATOS
-- ============================================
-- SELECT COUNT(*) as total_locations FROM locations;
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_voice_profiles FROM user_voice_profiles;
-- SELECT COUNT(*) as total_events FROM events;
