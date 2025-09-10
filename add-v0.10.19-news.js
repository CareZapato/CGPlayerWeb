const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addNews() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    const news = await prisma.news.create({
      data: {
        title: 'CGPlayer v0.10.19 - Corrección Sistema de Postulaciones',
        description: 'Hemos solucionado un problema crítico donde el botón de "Solicitar participación" no aparecía en eventos abiertos a postulaciones. Además, mejoramos la configuración de red con IPs dinámicas.',
        type: 'UPDATE',
        icon: '🔧',
        actionUrl: '/changelog',
        metadata: {
          version: '0.10.19',
          releaseDate: '2025-01-15',
          highlights: [
            'Fix crítico del botón de postulación a eventos',
            'Configuración de IP centralizada para backend',
            'Sistema de confirmación de asistencia mejorado',
            'URLs dinámicas para imágenes de perfil'
          ],
          category: 'bugfix'
        },
        isActive: true
      }
    });

    console.log('✅ Noticia creada exitosamente:', {
      id: news.id,
      title: news.title,
      type: news.type,
      createdAt: news.createdAt
    });

  } catch (error) {
    console.error('❌ Error al crear la noticia:', error);
    
    if (error.code === 'P1001') {
      console.log('💡 Sugerencia: Asegúrate de que la base de datos esté corriendo.');
    }
    
    if (error.code === 'P2002') {
      console.log('💡 La noticia ya existe o hay un conflicto de unique constraint.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

addNews();
