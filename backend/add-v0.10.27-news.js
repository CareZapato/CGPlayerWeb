const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addVersionNews() {
  try {
    // Crear noticia para versión 0.10.27
    const news = await prisma.news.create({
      data: {
        title: '🔧 CGPlayer v0.10.27 - Corrección Crítica de Errores',
        description: 'Corrección crítica: ProfilePage.tsx completamente reparado tras corrupción. Eliminados todos los errores TypeScript, layout reorganizado según especificaciones y estados informativos implementados.',
        type: 'VERSION_RELEASED',
        icon: '🔧',
        actionUrl: '/changelog',
        metadata: {
          version: '0.10.27',
          releaseDate: '2025-09-17',
          changes: [
            'ProfilePage.tsx reparado completamente tras corrupción crítica',
            'Eliminados todos los errores TypeScript de compilación',
            'Layout del perfil reorganizado: personal, vocal, roles',
            'Estados informativos para datos faltantes implementados',
            'SimplePlayer.tsx validado y funcionando correctamente'
          ],
          category: 'critical-fix'
        },
        isActive: true
      }
    });

    console.log('✅ Noticia de versión 0.10.27 creada exitosamente:', news.title);
    
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