const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Agregando noticias para la versión 0.12.42...');

    const news = [
      {
        type: 'VERSION_RELEASED',
        title: 'CGPlayer v0.12.42 - Mejoras Visuales y Nuevas Restricciones',
        description: 'Nueva actualización con mejoras significativas en el diseño del homepage, carrusel móvil optimizado, y nuevas restricciones de permisos para la creación de eventos por cuenta de usuario.',
        icon: '✨',
        metadata: {
          version: '0.12.42',
          releaseDate: '2025-09-25',
          changes: [
            'Mejoras visuales en homepage PC y móvil',
            'Carrusel móvil optimizado y responsivo',
            'Ajustes en paleta de colores para mejor contraste',
            'Restricciones de permisos para creación de eventos',
            'Títulos de noticias con mejor legibilidad',
            'Elementos de información con mayor contraste'
          ]
        },
        actionUrl: '/changelog'
      },
      {
        type: 'VERSION_RELEASED',
        title: 'Homepage Renovado con Diseño Responsivo',
        description: 'El homepage ha sido completamente renovado con una nueva paleta de colores, mejor contraste y un carrusel móvil optimizado para una experiencia de usuario superior.',
        icon: '🎨',
        metadata: {
          version: '0.12.42',
          section: 'UI/UX',
          improvements: [
            'Fondo con gradientes más ricos',
            'Elementos con mejor contraste visual',
            'Carrusel móvil responsivo',
            'Botones con colores temáticos diferenciados'
          ]
        },
        actionUrl: '/changelog'
      },
      {
        type: 'VERSION_RELEASED',
        title: 'Nuevas Restricciones de Permisos para Eventos',
        description: 'Se han implementado nuevas restricciones en la creación de eventos basadas en el tipo de cuenta de usuario, mejorando el control y la organización.',
        icon: '🔐',
        metadata: {
          version: '0.12.42',
          feature: 'Permisos de Usuario',
          restrictions: [
            'Control de acceso por tipo de cuenta',
            'Restricciones específicas para directores',
            'Validaciones mejoradas para administradores'
          ]
        },
        actionUrl: '/changelog'
      }
    ];

    console.log('📝 Creando noticias...');
    
    for (const newsItem of news) {
      const created = await prisma.news.create({
        data: newsItem
      });
      console.log(`✅ Noticia creada: ${created.title}`);
    }

    console.log('🎉 ¡Noticias de la versión 0.12.42 agregadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al agregar noticias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();