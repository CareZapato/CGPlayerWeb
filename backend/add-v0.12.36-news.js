const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addVersionNews() {
  try {
    console.log('🎯 [NEWS] Agregando noticia para versión 0.12.36...');
    
    const news = await prisma.news.create({
      data: {
        title: 'Nueva Versión 0.12.36: Experiencia Móvil Optimizada',
        description: '¡Navegación móvil completamente funcional! HomePage minimalista, submenú de gestión operativo, dashboard mejorado y código sin errores TypeScript. Tu experiencia móvil nunca fue tan fluida.',
        type: 'VERSION_RELEASED',
        icon: '📱',
        actionUrl: '/changelog',
        metadata: {
          version: '0.12.36',
          features: [
            'Navegación móvil completamente funcional',
            'HomePage minimalista para móviles',
            'Dashboard con descripciones claras',
            'Código TypeScript libre de errores',
            'Submenú de gestión rediseñado'
          ]
        },
        isActive: true
      }
    });

    console.log('✅ [NEWS] Noticia v0.12.36 creada exitosamente:', {
      id: news.id,
      title: news.title,
      type: news.type,
      icon: news.icon,
      createdAt: news.createdAt
    });

    console.log('🎉 [NEWS] ¡Nueva versión 0.12.36 anunciada a todos los usuarios!');

  } catch (error) {
    console.error('❌ [NEWS] Error al crear noticia v0.12.36:', error);
    
    if (error.code === 'P2002') {
      console.log('ℹ️ [NEWS] La noticia ya existe, no se creó duplicada');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  addVersionNews().catch(console.error);
}

module.exports = { addVersionNews };