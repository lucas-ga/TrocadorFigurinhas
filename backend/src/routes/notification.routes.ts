import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';

export const notificationRouter = Router();

// GET /api/notifications - Lista notificações do usuário
notificationRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { unreadOnly } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.userId,
                ...(unreadOnly === 'true' && { isRead: false })
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.userId, isRead: false }
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/notifications/:id/read - Marcar notificação como lida
notificationRouter.put('/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await prisma.notification.updateMany({
            where: { id, userId: req.userId },
            data: { isRead: true }
        });

        res.json({
            success: true,
            message: 'Notificação marcada como lida'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/notifications/read-all - Marcar todas como lidas
notificationRouter.put('/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.userId, isRead: false },
            data: { isRead: true }
        });

        res.json({
            success: true,
            message: 'Todas as notificações foram marcadas como lidas'
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/notifications/:id - Deletar notificação
notificationRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await prisma.notification.deleteMany({
            where: { id, userId: req.userId }
        });

        res.json({
            success: true,
            message: 'Notificação excluída'
        });
    } catch (error) {
        next(error);
    }
});
