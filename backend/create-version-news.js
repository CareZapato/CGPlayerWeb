import NewsService from './src/services/newsService.ts';

// Función para crear noticias de versión
async function createVersionNews() {
  try {
    console.log('📰 Creando noticia de versión v0.9.0...');
    
    const version = 'v0.9.0';
    const description = 'Sistema de noticias implementado: ¡Mantente al día con las novedades del sistema!';
    
    const news = await NewsService.createVersionNews(version, description);
    
    if (news) {
      console.log('✅ Noticia de versión creada exitosamente:', news.id);
      console.log('📝 Título:', news.title);
      console.log('📄 Descripción:', news.description);
    } else {
      console.log('❌ Error al crear la noticia de versión');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Función para crear noticias de ejemplo
async function createSampleNews() {
  try {
    console.log('📰 Creando noticias de ejemplo...');
    
    // Noticia del sistema
    await NewsService.createSystemNews(
      '🎉 Sistema de Noticias Activado',
      'A partir de ahora recibirás notificaciones automáticas sobre nuevas canciones, eventos y versiones del sistema.',
      '🔔',
      null,
      { type: 'system_activation', priority: 'high' }
    );

    // Noticia de bienvenida
    await NewsService.createSystemNews(
      '🌟 Bienvenido al Nuevo CGPlayer',
      'La página de inicio ha sido rediseñada para ser más simple y funcional. ¡Esperamos que disfrutes la nueva experiencia!',
      '✨',
      null,
      { type: 'ui_update', component: 'homepage' }
    );

    console.log('✅ Noticias de ejemplo creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando noticias de ejemplo:', error);
  }
}

// Ejecutar ambas funciones
async function main() {
  await createVersionNews();
  await createSampleNews();
  process.exit(0);
}

main();
