const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cgplayer',
  password: '123456',
  port: 5432,
});

async function addNews() {
  try {
    const newsQuery = `
      INSERT INTO news (title, content, date_published, is_published, version) 
      VALUES ($1, $2, CURRENT_TIMESTAMP, true, $3)
    `;

    const title = '🎵 CGPlayer v0.10.24 - Mejoras Visuales del Reproductor';
    const content = `
# 🚀 ¡Nueva Versión Disponible!

## 🎨 Mejoras Visuales del StickyPlayer

### 📱 Optimización para Móvil
- **Aumento de tamaño del 10%**: El reproductor sticky en versión móvil clara ahora es un 10% más grande para mejor usabilidad
- **Botones más grandes**: Los controles de reproducción (play, pause, siguiente, anterior) son ahora más grandes y fáciles de usar
- **Mejor organización**: Los elementos están mejor distribuidos y organizados en el espacio disponible

### ✨ Animaciones de Texto Mejoradas
- **Efecto marquee universal**: Todos los títulos de canciones ahora tienen efecto de barrido/desplazamiento
- **Animación inteligente**: El efecto se aplica tanto a títulos largos como cortos para mejor visualización
- **Experiencia consistente**: Funciona perfectamente en todas las versiones (PC, móvil claro, móvil oscuro)

### 🔄 Reproductor Minimizado Mejorado
- **Función de arrastre**: El reproductor minimizado (esfera) ahora se puede arrastrar por toda la pantalla
- **Interacción táctil mejorada**: Corrección del problema donde el toque para expandir solo funcionaba en PC
- **Compatibilidad universal**: Tanto el arrastre como la expansión funcionan correctamente en PC y móvil
- **Límites inteligentes**: El reproductor se mantiene siempre dentro de los límites visibles de la pantalla

### 🔧 Correcciones Técnicas
- **Eventos touch optimizados**: Mejor manejo de eventos táctiles para evitar conflictos entre arrastre y toque
- **Posicionamiento responsive**: Adaptación automática del tamaño según el dispositivo (4rem en desktop, 3.5rem en móvil)
- **Prevención de comportamientos no deseados**: Control preciso de preventDefault() para mantener funcionalidad nativa cuando es necesaria

---

**Versión**: 0.10.24  
**Fecha**: ${new Date().toLocaleDateString('es-ES')}  
**Compatibilidad**: Web PC, Móvil Android/iOS
    `.trim();

    await pool.query(newsQuery, [title, content, '0.10.24']);
    console.log('✅ Noticia v0.10.24 agregada correctamente');

  } catch (error) {
    console.error('❌ Error al agregar la noticia:', error);
  } finally {
    await pool.end();
  }
}

addNews();