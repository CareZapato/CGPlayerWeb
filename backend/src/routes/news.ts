import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active news
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);

    const news = await (prisma as any).news.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limitNum
    });

    res.json({
      success: true,
      data: news,
      total: news.length
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las noticias',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create news (for admin/testing purposes)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, icon, actionUrl, metadata } = req.body;

    if (!title || !description || !type || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: title, description, type, icon'
      });
    }

    const news = await (prisma as any).news.create({
      data: {
        title,
        description,
        type,
        icon,
        actionUrl: actionUrl || null,
        metadata: metadata || null,
      }
    });

    console.log(`📰 [NEWS] Created manually: ${title}`);
    
    res.json({
      success: true,
      data: news,
      message: 'Noticia creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la noticia',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete/deactivate news
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const news = await (prisma as any).news.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      data: news,
      message: 'Noticia desactivada exitosamente'
    });
  } catch (error) {
    console.error('Error deactivating news:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar la noticia',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cleanup old news (admin utility)
router.post('/cleanup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { daysOld = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await (prisma as any).news.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        isActive: true
      },
      data: { isActive: false }
    });

    console.log(`🧹 [NEWS] Cleaned up ${result.count} old news entries`);
    
    res.json({
      success: true,
      message: `${result.count} noticias antiguas desactivadas`,
      count: result.count
    });
  } catch (error) {
    console.error('Error cleaning up news:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar noticias antiguas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
