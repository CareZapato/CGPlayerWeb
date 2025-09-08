// Script para crear noticias de ejemplo usando ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para crear noticia de versión
async function createVersionNews() {
  try {
    console.log('📰 Creando noticia de versión v1.10.9...');
    
    const news = await (prisma as any).news.create({
      data: {
        title: 'Nueva Versión v1.10.9 Disponible',
        description: 'Sistema de noticias implementado: ¡Mantente al día con las novedades del sistema!',
        type: 'VERSION_RELEASED',
        icon: '🚀',
        actionUrl: '/changelog',
        metadata: { 
          version: 'v1.10.9',
          description: 'Sistema de noticias implementado: ¡Mantente al día con las novedades del sistema!'
        },
        isActive: true
      }
    });
    
    console.log('✅ Noticia de versión creada:', news.id);
    return news;
  } catch (error) {
    console.error('❌ Error creando noticia de versión:', error);
    return null;
  }
}

// Función para crear noticias de ejemplo
async function createSampleNews() {
  try {
    console.log('📰 Creando noticias de ejemplo...');
    
    // Noticia del sistema
    const systemNews = await (prisma as any).news.create({
      data: {
        title: '🎉 Sistema de Noticias Activado',
        description: 'A partir de ahora recibirás notificaciones automáticas sobre nuevas canciones, eventos y versiones del sistema.',
        type: 'VERSION_RELEASED',
        icon: '🔔',
        actionUrl: null,
        metadata: { type: 'system_activation', priority: 'high' },
        isActive: true
      }
    });

    // Noticia de bienvenida
    const welcomeNews = await (prisma as any).news.create({
      data: {
        title: '🌟 Bienvenido al Nuevo CGPlayer',
        description: 'La página de inicio ha sido rediseñada para ser más simple y funcional. ¡Esperamos que disfrutes la nueva experiencia!',
        type: 'VERSION_RELEASED',
        icon: '✨',
        actionUrl: '/',
        metadata: { type: 'ui_update', component: 'homepage' },
        isActive: true
      }
    });

    console.log('✅ Noticias de ejemplo creadas:', [systemNews.id, welcomeNews.id]);
    return [systemNews, welcomeNews];
  } catch (error) {
    console.error('❌ Error creando noticias de ejemplo:', error);
    return [];
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando creación de noticias...');
    
    await createVersionNews();
    await createSampleNews();
    
    console.log('✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error en proceso principal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
