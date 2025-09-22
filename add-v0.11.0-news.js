const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addVersionNews() {
  try {
    // Crear noticia para versión 0.11.0
    const news = await prisma.news.create({
      data: {
        title: '🎭 CGPlayer v0.11.0 - Sistema de Ensayos y Avatares Animados',
        description: 'Nueva funcionalidad completa de Ensayos con calendario especializado. Avatares animados con franjas identificadoras: morada ondulante para designados y dorada brillante para solicitudes externas.',
        type: 'VERSION_RELEASED',
        icon: '🎭',
        actionUrl: '/changelog',
        metadata: {
          version: '0.11.0',
          releaseDate: '2025-09-22',
          changes: [
            'Sistema completo de Ensayos con calendario especializado',
            'Avatares animados con franjas identificadoras por tipo de asistente',
            'Franja morada ondulante para asistentes designados',
            'Franja dorada brillante para solicitudes de unión',
            'Contadores dinámicos de asistentes por categoría',
            'Mejoras significativas en gestión de eventos y confirmación',
            'Visualización correcta de imágenes de perfil',
            'Eliminado refresco obligatorio tras cambios de asistencia'
          ],
          category: 'major-feature',
          mainFeature: 'Ensayos',
          visualFeatures: ['Avatares animados', 'Franjas identificadoras', 'Contadores dinámicos']
        },
        isActive: true
      }
    });

    console.log('✅ Noticia de versión 0.11.0 creada exitosamente:', news.title);
    
    // Mostrar todas las noticias actuales para verificar
    const allNews = await prisma.news.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n📰 Últimas 5 noticias activas:');
    allNews.forEach((n, i) => {
      console.log(`${i + 1}. ${n.title} - ${n.createdAt.toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error creando la noticia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVersionNews();