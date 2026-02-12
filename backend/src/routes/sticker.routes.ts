import { Router, Response, NextFunction, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

export const stickerRouter = Router();

// GET /api/stickers/albums - Lista todos os álbuns
stickerRouter.get('/albums', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const albums = await prisma.album.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { stickers: true, sections: true }
                }
            },
            orderBy: { year: 'desc' }
        });

        res.json({
            success: true,
            data: albums
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/stickers/albums/:albumId - Detalhes do álbum com seções
stickerRouter.get('/albums/:albumId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { albumId } = req.params;

        const album = await prisma.album.findUnique({
            where: { id: albumId },
            include: {
                sections: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        _count: {
                            select: { stickers: true }
                        }
                    }
                },
                _count: {
                    select: { stickers: true }
                }
            }
        });

        if (!album) {
            throw new AppError('Álbum não encontrado', 404);
        }

        res.json({
            success: true,
            data: album
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/stickers/albums/:albumId/stickers - Lista figurinhas do álbum
stickerRouter.get('/albums/:albumId/stickers', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { albumId } = req.params;
        const { sectionId, rarity, search } = req.query;

        const stickers = await prisma.sticker.findMany({
            where: {
                albumId,
                ...(sectionId && { sectionId: sectionId as string }),
                ...(rarity && { rarity: rarity as any }),
                ...(search && {
                    OR: [
                        { name: { contains: search as string, mode: 'insensitive' } },
                        { code: { contains: search as string, mode: 'insensitive' } }
                    ]
                })
            },
            include: {
                section: {
                    select: { name: true, code: true }
                }
            },
            orderBy: { number: 'asc' }
        });

        res.json({
            success: true,
            data: stickers
        });
    } catch (error) {
        next(error);
    }
});

// ==================== COLEÇÃO DO USUÁRIO ====================

// GET /api/stickers/my-collection - Figurinhas que o usuário tem
stickerRouter.get('/my-collection', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { albumId, forTrade, forSale } = req.query;

        const userStickers = await prisma.userSticker.findMany({
            where: {
                userId: req.userId,
                ...(albumId && { sticker: { albumId: albumId as string } }),
                ...(forTrade === 'true' && { forTrade: true }),
                ...(forSale === 'true' && { forSale: true })
            },
            include: {
                sticker: {
                    include: {
                        section: {
                            select: { name: true, code: true }
                        }
                    }
                }
            },
            orderBy: {
                sticker: { number: 'asc' }
            }
        });

        res.json({
            success: true,
            data: userStickers
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/stickers/my-collection - Adicionar figurinha à coleção
stickerRouter.post('/my-collection', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { stickerId, quantity = 1, forTrade = true, forSale = false, price } = req.body;

        // Verifica se figurinha existe
        const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
        if (!sticker) {
            throw new AppError('Figurinha não encontrada', 404);
        }

        // Verifica se já tem essa figurinha
        const existing = await prisma.userSticker.findUnique({
            where: {
                userId_stickerId: {
                    userId: req.userId!,
                    stickerId
                }
            }
        });

        let userSticker;
        if (existing) {
            // Atualiza quantidade
            userSticker = await prisma.userSticker.update({
                where: { id: existing.id },
                data: {
                    quantity: existing.quantity + quantity,
                    forTrade,
                    forSale,
                    price
                },
                include: { sticker: true }
            });
        } else {
            // Cria novo
            userSticker = await prisma.userSticker.create({
                data: {
                    userId: req.userId!,
                    stickerId,
                    quantity,
                    forTrade,
                    forSale,
                    price
                },
                include: { sticker: true }
            });

            // Remove da lista de desejadas se existir
            await prisma.userWantedSticker.deleteMany({
                where: {
                    userId: req.userId,
                    stickerId
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Figurinha adicionada à coleção!',
            data: userSticker
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/stickers/my-collection/:id - Atualizar figurinha da coleção
stickerRouter.put('/my-collection/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { quantity, forTrade, forSale, price } = req.body;

        const userSticker = await prisma.userSticker.findFirst({
            where: { id, userId: req.userId }
        });

        if (!userSticker) {
            throw new AppError('Figurinha não encontrada na sua coleção', 404);
        }

        const updated = await prisma.userSticker.update({
            where: { id },
            data: { quantity, forTrade, forSale, price },
            include: { sticker: true }
        });

        res.json({
            success: true,
            message: 'Figurinha atualizada!',
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/stickers/my-collection/:id - Remover figurinha da coleção
stickerRouter.delete('/my-collection/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const userSticker = await prisma.userSticker.findFirst({
            where: { id, userId: req.userId }
        });

        if (!userSticker) {
            throw new AppError('Figurinha não encontrada na sua coleção', 404);
        }

        await prisma.userSticker.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Figurinha removida da coleção!'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== LISTA DE DESEJADAS ====================

// GET /api/stickers/my-wanted - Figurinhas que o usuário precisa
stickerRouter.get('/my-wanted', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { albumId } = req.query;

        const wantedStickers = await prisma.userWantedSticker.findMany({
            where: {
                userId: req.userId,
                ...(albumId && { sticker: { albumId: albumId as string } })
            },
            include: {
                sticker: {
                    include: {
                        section: {
                            select: { name: true, code: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { sticker: { number: 'asc' } }
            ]
        });

        res.json({
            success: true,
            data: wantedStickers
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/stickers/my-wanted - Adicionar figurinha à lista de desejadas
stickerRouter.post('/my-wanted', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { stickerId, priority = 1 } = req.body;

        // Verifica se figurinha existe
        const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
        if (!sticker) {
            throw new AppError('Figurinha não encontrada', 404);
        }

        // Verifica se já tem essa figurinha
        const owned = await prisma.userSticker.findUnique({
            where: {
                userId_stickerId: {
                    userId: req.userId!,
                    stickerId
                }
            }
        });
        if (owned) {
            throw new AppError('Você já tem essa figurinha na sua coleção', 400);
        }

        // Verifica se já está na lista de desejadas
        const existing = await prisma.userWantedSticker.findUnique({
            where: {
                userId_stickerId: {
                    userId: req.userId!,
                    stickerId
                }
            }
        });
        if (existing) {
            throw new AppError('Figurinha já está na lista de desejadas', 400);
        }

        const wantedSticker = await prisma.userWantedSticker.create({
            data: {
                userId: req.userId!,
                stickerId,
                priority
            },
            include: { sticker: true }
        });

        res.status(201).json({
            success: true,
            message: 'Figurinha adicionada à lista de desejadas!',
            data: wantedSticker
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/stickers/my-wanted/:id - Remover figurinha da lista de desejadas
stickerRouter.delete('/my-wanted/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const wantedSticker = await prisma.userWantedSticker.findFirst({
            where: { id, userId: req.userId }
        });

        if (!wantedSticker) {
            throw new AppError('Figurinha não encontrada na lista de desejadas', 404);
        }

        await prisma.userWantedSticker.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Figurinha removida da lista de desejadas!'
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/stickers/bulk-add - Adicionar várias figurinhas de uma vez
stickerRouter.post('/bulk-add', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { stickerIds, type } = req.body; // type: 'owned' ou 'wanted'

        if (!Array.isArray(stickerIds) || stickerIds.length === 0) {
            throw new AppError('Lista de figurinhas inválida', 400);
        }

        if (type === 'owned') {
            // Adiciona às figurinhas que tem
            const results = await Promise.all(
                stickerIds.map(async (stickerId: string) => {
                    const existing = await prisma.userSticker.findUnique({
                        where: {
                            userId_stickerId: {
                                userId: req.userId!,
                                stickerId
                            }
                        }
                    });

                    if (existing) {
                        return prisma.userSticker.update({
                            where: { id: existing.id },
                            data: { quantity: existing.quantity + 1 }
                        });
                    }

                    // Remove da lista de desejadas
                    await prisma.userWantedSticker.deleteMany({
                        where: { userId: req.userId, stickerId }
                    });

                    return prisma.userSticker.create({
                        data: {
                            userId: req.userId!,
                            stickerId,
                            quantity: 1,
                            forTrade: true
                        }
                    });
                })
            );

            res.json({
                success: true,
                message: `${results.length} figurinhas adicionadas à coleção!`,
                data: { count: results.length }
            });
        } else if (type === 'wanted') {
            // Adiciona à lista de desejadas
            const results = await Promise.all(
                stickerIds.map(async (stickerId: string) => {
                    // Verifica se já tem ou já está na lista
                    const owned = await prisma.userSticker.findUnique({
                        where: {
                            userId_stickerId: { userId: req.userId!, stickerId }
                        }
                    });
                    if (owned) return null;

                    const existing = await prisma.userWantedSticker.findUnique({
                        where: {
                            userId_stickerId: { userId: req.userId!, stickerId }
                        }
                    });
                    if (existing) return null;

                    return prisma.userWantedSticker.create({
                        data: {
                            userId: req.userId!,
                            stickerId,
                            priority: 1
                        }
                    });
                })
            );

            const added = results.filter(r => r !== null);
            res.json({
                success: true,
                message: `${added.length} figurinhas adicionadas à lista de desejadas!`,
                data: { count: added.length }
            });
        } else {
            throw new AppError('Tipo inválido. Use "owned" ou "wanted"', 400);
        }
    } catch (error) {
        next(error);
    }
});
