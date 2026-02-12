import { Router, Response, NextFunction, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest, optionalAuth } from '../middlewares/auth.js';

export const matchRouter = Router();

// Interface para os matches
interface Match {
    user: {
        id: string;
        nickname: string;
        avatarUrl: string | null;
        city: string | null;
        state: string | null;
    };
    canOffer: Array<{
        id: string;
        code: string;
        name: string;
        section: { name: string; code: string };
    }>;
    wants: Array<{
        id: string;
        code: string;
        name: string;
        section: { name: string; code: string };
    }>;
    matchScore: number;
}

// GET /api/match/find - Encontra matches para troca
matchRouter.get('/find', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { albumId, city, state, limit = '20' } = req.query;

        // Busca figurinhas que o usuário precisa
        const userWanted = await prisma.userWantedSticker.findMany({
            where: {
                userId: req.userId,
                ...(albumId && { sticker: { albumId: albumId as string } })
            },
            select: { stickerId: true }
        });
        const wantedIds = userWanted.map(w => w.stickerId);

        // Busca figurinhas que o usuário tem para troca
        const userOwned = await prisma.userSticker.findMany({
            where: {
                userId: req.userId,
                forTrade: true,
                quantity: { gt: 0 },
                ...(albumId && { sticker: { albumId: albumId as string } })
            },
            select: { stickerId: true }
        });
        const ownedIds = userOwned.map(o => o.stickerId);

        if (wantedIds.length === 0) {
            return res.json({
                success: true,
                message: 'Você não tem figurinhas na lista de desejadas. Adicione as que precisa!',
                data: []
            });
        }

        // Busca usuários que TÊM o que o usuário logado PRECISA
        const potentialMatches = await prisma.userSticker.findMany({
            where: {
                stickerId: { in: wantedIds },
                forTrade: true,
                quantity: { gt: 0 },
                userId: { not: req.userId },
                user: {
                    isActive: true,
                    ...(city && { city: city as string }),
                    ...(state && { state: state as string })
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        avatarUrl: true,
                        city: true,
                        state: true
                    }
                },
                sticker: {
                    include: {
                        section: { select: { name: true, code: true } }
                    }
                }
            }
        });

        // Agrupa por usuário
        const userMatchMap = new Map<string, Match>();

        for (const match of potentialMatches) {
            const userId = match.user.id;

            if (!userMatchMap.has(userId)) {
                userMatchMap.set(userId, {
                    user: match.user,
                    canOffer: [],
                    wants: [],
                    matchScore: 0
                });
            }

            const userMatch = userMatchMap.get(userId)!;
            userMatch.canOffer.push({
                id: match.sticker.id,
                code: match.sticker.code,
                name: match.sticker.name,
                section: match.sticker.section
            });
        }

        // Para cada usuário potencial, verifica se ele PRECISA de algo que o usuário logado TEM
        for (const [userId, matchData] of userMatchMap) {
            // Busca o que esse usuário precisa
            const theirWanted = await prisma.userWantedSticker.findMany({
                where: {
                    userId,
                    stickerId: { in: ownedIds }
                },
                include: {
                    sticker: {
                        include: {
                            section: { select: { name: true, code: true } }
                        }
                    }
                }
            });

            matchData.wants = theirWanted.map(w => ({
                id: w.sticker.id,
                code: w.sticker.code,
                name: w.sticker.name,
                section: w.sticker.section
            }));

            // Calcula score baseado na compatibilidade
            // Quanto mais figurinhas podem ser trocadas, melhor
            matchData.matchScore = matchData.canOffer.length + matchData.wants.length * 2;
        }

        // Ordena por score e retorna os melhores matches
        const matches = Array.from(userMatchMap.values())
            .filter(m => m.matchScore > 0) // Apenas matches com alguma compatibilidade
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, parseInt(limit as string));

        res.json({
            success: true,
            data: matches,
            meta: {
                totalMatches: matches.length,
                yourWantedCount: wantedIds.length,
                yourOwnedForTradeCount: ownedIds.length
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/match/sticker/:stickerId - Quem tem essa figurinha para troca
matchRouter.get('/sticker/:stickerId', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { stickerId } = req.params;
        const { city, state } = req.query;

        const sticker = await prisma.sticker.findUnique({
            where: { id: stickerId },
            include: { section: { select: { name: true, code: true } } }
        });

        if (!sticker) {
            return res.status(404).json({
                success: false,
                message: 'Figurinha não encontrada'
            });
        }

        const usersWithSticker = await prisma.userSticker.findMany({
            where: {
                stickerId,
                forTrade: true,
                quantity: { gt: 0 },
                ...(req.userId && { userId: { not: req.userId } }),
                user: {
                    isActive: true,
                    ...(city && { city: city as string }),
                    ...(state && { state: state as string })
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        avatarUrl: true,
                        city: true,
                        state: true,
                        _count: {
                            select: { receivedRatings: true }
                        }
                    }
                }
            },
            orderBy: { quantity: 'desc' }
        });

        // Busca média de avaliação para cada usuário
        const usersWithRating = await Promise.all(
            usersWithSticker.map(async (us) => {
                const rating = await prisma.rating.aggregate({
                    where: { ratedId: us.user.id },
                    _avg: { score: true }
                });
                return {
                    ...us.user,
                    quantity: us.quantity,
                    forSale: us.forSale,
                    price: us.price,
                    rating: rating._avg.score || 0
                };
            })
        );

        res.json({
            success: true,
            data: {
                sticker,
                users: usersWithRating
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/match/user/:userId/compatible - Figurinhas compatíveis com outro usuário
matchRouter.get('/user/:userId/compatible', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                message: 'Selecione outro usuário'
            });
        }

        // O que EU tenho e ELE precisa
        const myOwnedTheyWant = await prisma.userSticker.findMany({
            where: {
                userId: req.userId,
                forTrade: true,
                quantity: { gt: 0 },
                sticker: {
                    userWanted: {
                        some: { userId }
                    }
                }
            },
            include: {
                sticker: {
                    include: { section: { select: { name: true, code: true } } }
                }
            }
        });

        // O que ELE tem e EU preciso
        const theyOwnIWant = await prisma.userSticker.findMany({
            where: {
                userId,
                forTrade: true,
                quantity: { gt: 0 },
                sticker: {
                    userWanted: {
                        some: { userId: req.userId }
                    }
                }
            },
            include: {
                sticker: {
                    include: { section: { select: { name: true, code: true } } }
                }
            }
        });

        res.json({
            success: true,
            data: {
                iCanOffer: myOwnedTheyWant.map(s => ({
                    id: s.sticker.id,
                    code: s.sticker.code,
                    name: s.sticker.name,
                    section: s.sticker.section,
                    quantity: s.quantity
                })),
                theyCanOffer: theyOwnIWant.map(s => ({
                    id: s.sticker.id,
                    code: s.sticker.code,
                    name: s.sticker.name,
                    section: s.sticker.section,
                    quantity: s.quantity
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});
