import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

export const userRouter = Router();

// GET /api/users/me - Perfil do usuário logado
userRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                phone: true,
                city: true,
                state: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
                isVerified: true,
                _count: {
                    select: {
                        ownedStickers: true,
                        wantedStickers: true,
                        receivedRatings: true
                    }
                }
            }
        });

        // Calcula média de avaliações
        const ratings = await prisma.rating.aggregate({
            where: { ratedId: req.userId },
            _avg: { score: true },
            _count: true
        });

        res.json({
            success: true,
            data: {
                ...user,
                rating: {
                    average: ratings._avg.score || 0,
                    count: ratings._count
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/me - Atualizar perfil
userRouter.put('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, nickname, phone, city, state, bio } = req.body;

        // Verifica se nickname já está em uso por outro usuário
        if (nickname) {
            const existingNickname = await prisma.user.findFirst({
                where: {
                    nickname,
                    NOT: { id: req.userId }
                }
            });
            if (existingNickname) {
                throw new AppError('Este apelido já está em uso', 400);
            }
        }

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { name, nickname, phone, city, state, bio },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                phone: true,
                city: true,
                state: true,
                bio: true,
                avatarUrl: true
            }
        });

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso!',
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:nickname - Perfil público de um usuário
userRouter.get('/:nickname', async (req, res, next) => {
    try {
        const { nickname } = req.params;

        const user = await prisma.user.findUnique({
            where: { nickname },
            select: {
                id: true,
                name: true,
                nickname: true,
                city: true,
                state: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
                isVerified: true,
                _count: {
                    select: {
                        ownedStickers: { where: { forTrade: true } },
                        wantedStickers: true,
                        receivedRatings: true
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        // Calcula média de avaliações
        const ratings = await prisma.rating.aggregate({
            where: { ratedId: user.id },
            _avg: { score: true },
            _count: true
        });

        // Busca últimas avaliações
        const lastRatings = await prisma.rating.findMany({
            where: { ratedId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                score: true,
                comment: true,
                createdAt: true,
                rater: {
                    select: {
                        nickname: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: {
                ...user,
                rating: {
                    average: ratings._avg.score || 0,
                    count: ratings._count
                },
                lastRatings
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/users/:id/rate - Avaliar usuário
userRouter.post('/:id/rate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { score, comment, tradeId } = req.body;

        if (id === req.userId) {
            throw new AppError('Você não pode avaliar a si mesmo', 400);
        }

        if (score < 1 || score > 5) {
            throw new AppError('A nota deve ser entre 1 e 5', 400);
        }

        // Verifica se usuário existe
        const userToRate = await prisma.user.findUnique({ where: { id } });
        if (!userToRate) {
            throw new AppError('Usuário não encontrado', 404);
        }

        // Verifica se já avaliou (se tiver tradeId, pode avaliar novamente para outra troca)
        const existingRating = await prisma.rating.findFirst({
            where: {
                raterId: req.userId,
                ratedId: id,
                ...(tradeId ? { tradeId } : { tradeId: null })
            }
        });

        if (existingRating) {
            throw new AppError('Você já avaliou este usuário para esta troca', 400);
        }

        const rating = await prisma.rating.create({
            data: {
                raterId: req.userId!,
                ratedId: id,
                score,
                comment,
                tradeId
            }
        });

        // Cria notificação
        await prisma.notification.create({
            data: {
                userId: id,
                type: 'NEW_RATING',
                title: 'Nova avaliação recebida',
                message: `${req.user?.nickname} te avaliou com ${score} estrela${score > 1 ? 's' : ''}`,
                data: { ratingId: rating.id }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Avaliação registrada com sucesso!',
            data: rating
        });
    } catch (error) {
        next(error);
    }
});
