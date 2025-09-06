import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NewsData {
  title: string;
  description: string;
  type: 'SONG_ADDED' | 'EVENT_CREATED' | 'EVENT_UPDATED' | 'VERSION_RELEASED';
  icon: string;
  actionUrl?: string;
  metadata?: any;
}

export class NewsService {
  /**
   * Create a new news entry
   */
  static async createNews(newsData: NewsData) {
    try {
      const news = await (prisma as any).news.create({
        data: {
          title: newsData.title,
          description: newsData.description,
          type: newsData.type,
          icon: newsData.icon,
          actionUrl: newsData.actionUrl,
          metadata: newsData.metadata,
        }
      });
      
      console.log(`📰 [NEWS] Created: ${newsData.title}`);
      return news;
    } catch (error) {
      console.error('❌ Error creating news:', error);
      throw error;
    }
  }

  /**
   * Get all active news ordered by creation date
   */
  static async getActiveNews(limit: number = 20) {
    try {
      const news = await (prisma as any).news.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      return news;
    } catch (error) {
      console.error('❌ Error fetching news:', error);
      throw error;
    }
  }

  /**
   * Auto-create news when a new song is added
   */
  static async createSongAddedNews(songTitle: string, artistName: string, songId: string) {
    const newsData: NewsData = {
      title: songTitle, // Título de la canción directamente
      description: `Nueva canción agregada al catálogo`,
      type: 'SONG_ADDED',
      icon: '🎵',
      actionUrl: `/albums?search=${encodeURIComponent(songTitle)}`,
      metadata: { 
        songId, 
        songTitle, 
        artist: artistName,
        searchQuery: songTitle
      }
    };

    return await this.createNews(newsData);
  }

  /**
   * Auto-create news when a new event is created
   */
  static async createEventCreatedNews(eventTitle: string, eventDate: string, eventId: string, eventCategory: string = 'Culto') {
    const newsData: NewsData = {
      title: eventTitle, // Título del evento directamente
      description: `Nuevo evento programado`,
      type: 'EVENT_CREATED',
      icon: '📅',
      actionUrl: `/events`,
      metadata: { 
        eventId, 
        eventTitle, 
        date: eventDate,
        eventCategory
      }
    };

    return await this.createNews(newsData);
  }

  /**
   * Auto-create news when an event is updated
   */
  static async createEventUpdatedNews(eventTitle: string, eventDate: string, eventId: string, eventCategory: string = 'Culto') {
    const newsData: NewsData = {
      title: eventTitle, // Título del evento directamente
      description: `Evento actualizado`,
      type: 'EVENT_UPDATED',
      icon: '📅',
      actionUrl: `/events`,
      metadata: { 
        eventId, 
        eventTitle, 
        date: eventDate,
        eventCategory
      }
    };

    return await this.createNews(newsData);
  }

  /**
   * Auto-create news for version releases
   */
  static async createVersionNews(version: string, description: string) {
    const newsData: NewsData = {
      title: `CGPlayer ${version}`,
      description: description,
      type: 'VERSION_RELEASED',
      icon: '🚀',
      actionUrl: '/changelog',
      metadata: { 
        version,
        description
      }
    };

    return await this.createNews(newsData);
  }

  /**
   * Auto-create news for system announcements
   */
  static async createSystemNews(title: string, description: string, icon: string = '📢', actionUrl?: string) {
    const newsData: NewsData = {
      title,
      description,
      type: 'VERSION_RELEASED', // Using VERSION_RELEASED for system news
      icon,
      actionUrl,
      metadata: { type: 'system_announcement' }
    };

    return await this.createNews(newsData);
  }

  /**
   * Mark old news as inactive to keep the feed clean
   */
  static async cleanupOldNews(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await (prisma as any).news.updateMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      console.log(`🧹 [NEWS] Cleaned up ${result.count} old news entries`);
      return result;
    } catch (error) {
      console.error('❌ Error cleaning up news:', error);
      throw error;
    }
  }
}

export default NewsService;
