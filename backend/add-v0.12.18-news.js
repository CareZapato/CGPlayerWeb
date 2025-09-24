const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addVersionNews() {
  try {
    console.log('🎯 [NEWS] Agregando noticia para versión 0.12.18...');
    
    const news = await prisma.news.create({
      data: {
        title: 'Nueva Versión 0.12.18: Sistema de Estadísticas con Datos Reales',
        description: '¡Descubre tu progreso musical con estadísticas reales! Sistema de estadísticas con datos reales implementado, sistema de logros mejorado, y perfil completamente rediseñado.',
        type: 'VERSION_RELEASED',
        icon: '📊',
        actionUrl: '/profile',
        metadata: {
          version: '0.12.18',
          features: [
            'Sistema de estadísticas reales',
            'Sección separada de logros',
            'Perfil rediseñado y responsive',
            'API optimizada con endpoint /profile/stats'
          ]
        },
        isActive: true
      }
    });

    console.log('✅ [NEWS] Noticia v0.12.18 creada exitosamente:', {
      id: news.id,
      title: news.title,
      type: news.type,
      icon: news.icon,
      createdAt: news.createdAt
    });

    console.log('🎉 [NEWS] ¡Nueva versión 0.12.18 anunciada a todos los usuarios!');

  } catch (error) {
    console.error('❌ [NEWS] Error al crear noticia v0.12.18:', error);
    
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