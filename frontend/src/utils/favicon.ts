// Utilidad para cambiar el favicon dinámicamente
export const updateFavicon = (songTitle: string) => {
  // Generar color basado en el título de la canción
  const generateColorFromTitle = (title: string): [string, string] => {
    const colors: [string, string][] = [
      ['#3B82F6', '#1E40AF'], // blue
      ['#10B981', '#047857'], // green
      ['#F59E0B', '#D97706'], // yellow
      ['#EF4444', '#DC2626'], // red
      ['#8B5CF6', '#7C3AED'], // purple
      ['#F97316', '#EA580C'], // orange
      ['#06B6D4', '#0891B2'], // cyan
      ['#84CC16', '#65A30D'], // lime
    ];
    
    const colorIndex = title.length % colors.length;
    return colors[colorIndex];
  };

  // Crear favicon dinámico
  const createFavicon = (title: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const [color1, color2] = generateColorFromTitle(title);
      
      // Crear gradiente
      const gradient = ctx.createLinearGradient(0, 0, 32, 32);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      // Fondo con gradiente
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      
      // Agregar letra inicial
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title.charAt(0).toUpperCase(), 16, 16);
    }
    
    return canvas.toDataURL('image/png');
  };

  // Actualizar favicon
  const updateFaviconElement = (dataUrl: string) => {
    // Remover favicon existente
    const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Crear nuevo favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = dataUrl;
    document.head.appendChild(favicon);
  };

  // Actualizar título de la página
  const updatePageTitle = (title: string) => {
    document.title = `${title} - CGPlayer`;
  };

  // Ejecutar actualizaciones
  const faviconDataUrl = createFavicon(songTitle);
  updateFaviconElement(faviconDataUrl);
  updatePageTitle(songTitle);
};

// Restaurar favicon por defecto
export const resetFavicon = () => {
  // Remover favicon existente
  const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (existingFavicon) {
    existingFavicon.remove();
  }

  // Crear favicon por defecto para CGPlayer
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Fondo azul degradado
    const gradient = ctx.createLinearGradient(0, 0, 32, 32);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#1E40AF');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    // Agregar "CG"
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CG', 16, 16);
  }

  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.href = canvas.toDataURL('image/png');
  document.head.appendChild(favicon);

  // Título por defecto
  document.title = 'CGPlayer';
};
