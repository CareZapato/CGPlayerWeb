import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/newsApi';
import type { NewsItem } from '../services/newsApi';
import './NewsCard.css';

interface NewsCardProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  limit = 10, 
  showTitle = true,
  className = '' 
}) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, [limit]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getNews(limit);
      if (response.success) {
        setNews(response.data);
      } else {
        setError('Error al cargar las noticias');
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const getNewsIcon = (type: string, customIcon?: string) => {
    if (customIcon && customIcon !== '🔔' && customIcon !== '✨') return customIcon;
    
    switch (type) {
      case 'SONG_ADDED':
        return '🎵';
      case 'EVENT_CREATED':
      case 'EVENT_UPDATED':
        return '📅';
      case 'VERSION_RELEASED':
        return customIcon === '�' ? '🔔' : customIcon === '✨' ? '✨' : '�🚀';
      default:
        return '📢';
    }
  };

  const getNewsTypeLabel = (type: string) => {
    switch (type) {
      case 'SONG_ADDED':
        return 'NUEVA CANCIÓN';
      case 'EVENT_CREATED':
        return 'NUEVO EVENTO';
      case 'EVENT_UPDATED':
        return 'EVENTO ACTUALIZADO';
      case 'VERSION_RELEASED':
        return 'NUEVA VERSIÓN';
      default:
        return 'NOTICIA';
    }
  };

  const getEventDate = (metadata: any) => {
    if (metadata?.date) {
      const eventDate = new Date(metadata.date);
      const day = eventDate.getDate();
      const month = eventDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
      return { day, month };
    }
    return null;
  };

  const renderNewsIcon = (item: NewsItem) => {
    const icon = getNewsIcon(item.type, item.icon);
    const eventDate = getEventDate(item.metadata);
    
    if ((item.type === 'EVENT_CREATED' || item.type === 'EVENT_UPDATED') && eventDate) {
      return (
        <div className="news-icon">
          <div className="text-lg">📅</div>
          <div className="event-date">
            <div className="event-day">{eventDate.day}</div>
            <div className="event-month">{eventDate.month}</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="news-icon">
        <div className="icon-emoji">{icon}</div>
      </div>
    );
  };

  const handleNewsClick = (item: NewsItem) => {
    if (item.actionUrl) {
      // Si es una URL externa, abrirla en nueva pestaña
      if (item.actionUrl.startsWith('http')) {
        window.open(item.actionUrl, '_blank');
      } else {
        // Si es una ruta interna, navegar dentro de la app
        window.location.href = item.actionUrl;
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className={`news-card ${className}`}>
        {showTitle && <h3 className="news-card-title">📰 Últimas Noticias</h3>}
        <div className="news-loading">
          <div className="loading-spinner"></div>
          <p>Cargando noticias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`news-card ${className}`}>
        {showTitle && <h3 className="news-card-title">📰 Últimas Noticias</h3>}
        <div className="news-error">
          <p>❌ {error}</p>
          <button onClick={loadNews} className="retry-button">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className={`news-card ${className}`}>
        {showTitle && <h3 className="news-card-title">📰 Últimas Noticias</h3>}
        <div className="news-empty">
          <p>📭 No hay noticias recientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`news-card ${className}`}>
      {showTitle && (
        <div className="news-card-header">
          <h3 className="news-card-title">📰 Últimas Noticias</h3>
          <button onClick={loadNews} className="refresh-button" title="Actualizar">
            🔄
          </button>
        </div>
      )}
      
      <div className="news-list">
        {news.map((item) => (
          <div
            key={item.id}
            className={`news-item ${item.actionUrl ? 'clickable' : ''}`}
            onClick={() => handleNewsClick(item)}
            title={item.actionUrl ? 'Hacer clic para más información' : undefined}
          >
            {renderNewsIcon(item)}
            
            <div className="news-content">
              <div className="news-header">
                <span className="news-type-prominent">{getNewsTypeLabel(item.type)}</span>
                <span className="news-date">{formatDate(item.createdAt)}</span>
              </div>
              <h4 className="news-title">{item.title}</h4>
              
              {item.metadata && (
                <div className="news-metadata">
                  {item.metadata.artist && (
                    <span className="metadata-tag">👤 {item.metadata.artist}</span>
                  )}
                  {item.metadata.location && (
                    <span className="metadata-tag">📍 {item.metadata.location}</span>
                  )}
                  {item.metadata.version && (
                    <span className="metadata-tag">� {item.metadata.version}</span>
                  )}
                </div>
              )}
            </div>
            
            {item.actionUrl && (
              <div className="news-action">
                <span className="action-arrow">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsCard;
