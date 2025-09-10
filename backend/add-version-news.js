// Script para agregar noticia de la versión 0.10.19
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addVersionNews() {
  try {
    // Crear noticia para versión 0.10.19
    const news = await prisma.news.create({
      data: {
        title: '🔧 CGPlayer v0.10.19',
        description: 'Fix crítico: Sistema de postulaciones a eventos completamente funcional. Botón "Solicitar participación" corregido, configuración IP centralizada implementada y URLs dinámicas para mayor flexibilidad de red.',
        type: 'VERSION_RELEASED',
        icon: '🔧',
        actionUrl: '/changelog',
        metadata: {
          version: '0.10.19',
          releaseDate: '2025-01-15',
          changes: [
            'Corrección del botón de solicitar participación en eventos',
            'Footer del modal de eventos ahora aparece correctamente',
            'Configuración IP centralizada en backend',
            'URLs dinámicas para imágenes de perfil',
            'Sistema completo de confirmación de asistencia'
          ],
          category: 'bugfix'
        },
        isActive: true
      }
    });

    console.log('✅ Noticia de versión 0.10.19 creada exitosamente:', news.title);
    
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
