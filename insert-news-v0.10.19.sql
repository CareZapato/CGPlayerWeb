-- Script SQL para insertar noticia de CGPlayer v0.10.19
INSERT INTO "public"."News" (
    "id",
    "title", 
    "description",
    "type",
    "icon",
    "actionUrl",
    "metadata",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'CGPlayer v0.10.19 - Corrección Sistema de Postulaciones',
    'Hemos solucionado un problema crítico donde el botón de "Solicitar participación" no aparecía en eventos abiertos a postulaciones. Además, mejoramos la configuración de red con IPs dinámicas.',
    'UPDATE',
    '🔧',
    '/changelog',
    '{
        "version": "0.10.19",
        "releaseDate": "2025-01-15",
        "highlights": [
            "Fix crítico del botón de postulación a eventos",
            "Configuración de IP centralizada para backend",
            "Sistema de confirmación de asistencia mejorado",
            "URLs dinámicas para imágenes de perfil"
        ],
        "category": "bugfix"
    }'::jsonb,
    true,
    NOW(),
    NOW()
);

-- Verificar que se insertó correctamente
SELECT "title", "type", "createdAt" FROM "public"."News" WHERE "title" LIKE '%0.10.19%' ORDER BY "createdAt" DESC LIMIT 1;
