import { Router, Response, NextFunction, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

export const tradeRouter = Router();

// GET /api/trades - Lista trocas do usuário
tradeRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status, type } = req.query; // type: 'sent', 'received', 'all'

        const whereClause: any = {};

        if (type === 'sent') {
            whereClause.senderId = req.userId;
        } else if (type === 'received') {
            whereClause.receiverId = req.userId;
        } else {
            whereClause.OR = [
                { senderId: req.userId },
                { receiverId: req.userId }
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        const trades = await prisma.trade.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: { id: true, nickname: true, avatarUrl: true, city: true, state: true }
                },
                receiver: {
                    select: { id: true, nickname: true, avatarUrl: true, city: true, state: true }
                },
                items: {
                    include: {
                        offeredSticker: {
                            include: { section: { select: { name: true, code: true } } }
                        },
                        requestedSticker: {
                            include: { section: { select: { name: true, code: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: trades
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/trades/:id - Detalhes de uma troca
tradeRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const trade = await prisma.trade.findFirst({
            where: {
                id,
                OR: [
                    { senderId: req.userId },
                    { receiverId: req.userId }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true, nickname: true, avatarUrl: true, city: true, state: true, phone: true
                    }
                },
                receiver: {
                    select: {
                        id: true, nickname: true, avatarUrl: true, city: true, state: true, phone: true
                    }
                },
                items: {
                    include: {
                        offeredSticker: {
                            include: { section: { select: { name: true, code: true } } }
                        },
                        requestedSticker: {
                            include: { section: { select: { name: true, code: true } } }
                        }
                    }
                }
            }
        });

        if (!trade) {
            throw new AppError('Troca não encontrada', 404);
        }

        res.json({
            success: true,
            data: trade
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/trades - Criar proposta de troca
tradeRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { receiverId, message, offeredStickerIds, requestedStickerIds } = req.body;

        if (receiverId === req.userId) {
            throw new AppError('Você não pode propor uma troca consigo mesmo', 400);
        }

        // Verifica se receptor existe
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver) {
            throw new AppError('Usuário não encontrado', 404);
        }

        // Verifica se as figurinhas oferecidas pertencem ao usuário
        for (const stickerId of offeredStickerIds) {
            const userSticker = await prisma.userSticker.findFirst({
                where: {
                    userId: req.userId,
                    stickerId,
                    forTrade: true,
                    quantity: { gt: 0 }
                }
            });
            if (!userSticker) {
                throw new AppError(`Você não tem a figurinha ${stickerId} disponível para troca`, 400);
            }
        }

        // Verifica se as figurinhas solicitadas pertencem ao receptor
        for (const stickerId of requestedStickerIds) {
            const userSticker = await prisma.userSticker.findFirst({
                where: {
                    userId: receiverId,
                    stickerId,
                    forTrade: true,
                    quantity: { gt: 0 }
                }
            });
            if (!userSticker) {
                throw new AppError(`O usuário não tem a figurinha ${stickerId} disponível para troca`, 400);
            }
        }

        // Cria a troca
        const trade = await prisma.trade.create({
            data: {
                senderId: req.userId!,
                receiverId,
                message,
                items: {
                    create: [
                        ...offeredStickerIds.map((id: string) => ({ offeredId: id })),
                        ...requestedStickerIds.map((id: string) => ({ requestedId: id }))
                    ]
                }
            },
            include: {
                sender: { select: { nickname: true } },
                receiver: { select: { nickname: true } },
                items: {
                    include: {
                        offeredSticker: true,
                        requestedSticker: true
                    }
                }
            }
        });

        // Notifica o receptor
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'TRADE_RECEIVED',
                title: 'Nova proposta de troca!',
                message: `${req.user?.nickname} quer trocar figurinhas com você`,
                data: { tradeId: trade.id }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Proposta de troca enviada!',
            data: trade
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/trades/:id/accept - Aceitar troca
tradeRouter.put('/:id/accept', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const trade = await prisma.trade.findFirst({
            where: { id, receiverId: req.userId, status: 'PENDING' },
            include: { items: true, sender: { select: { nickname: true } } }
        });

        if (!trade) {
            throw new AppError('Troca não encontrada ou você não tem permissão', 404);
        }

        // Atualiza status
        const updatedTrade = await prisma.trade.update({
            where: { id },
            data: { status: 'ACCEPTED' }
        });

        // Notifica o remetente
        await prisma.notification.create({
            data: {
                userId: trade.senderId,
                type: 'TRADE_ACCEPTED',
                title: 'Troca aceita!',
                message: `${req.user?.nickname} aceitou sua proposta de troca`,
                data: { tradeId: trade.id }
            }
        });

        res.json({
            success: true,
            message: 'Troca aceita! Entre em contato para combinar a entrega.',
            data: updatedTrade
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/trades/:id/reject - Rejeitar troca
tradeRouter.put('/:id/reject', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { responseMessage } = req.body;

        const trade = await prisma.trade.findFirst({
            where: { id, receiverId: req.userId, status: 'PENDING' }
        });

        if (!trade) {
            throw new AppError('Troca não encontrada ou você não tem permissão', 404);
        }

        const updatedTrade = await prisma.trade.update({
            where: { id },
            data: { status: 'REJECTED', responseMessage }
        });

        // Notifica o remetente
        await prisma.notification.create({
            data: {
                userId: trade.senderId,
                type: 'TRADE_REJECTED',
                title: 'Troca recusada',
                message: `${req.user?.nickname} recusou sua proposta de troca`,
                data: { tradeId: trade.id }
            }
        });

        res.json({
            success: true,
            message: 'Troca recusada.',
            data: updatedTrade
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/trades/:id/complete - Marcar troca como concluída
tradeRouter.put('/:id/complete', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const trade = await prisma.trade.findFirst({
            where: {
                id,
                status: 'ACCEPTED',
                OR: [
                    { senderId: req.userId },
                    { receiverId: req.userId }
                ]
            },
            include: { items: true }
        });

        if (!trade) {
            throw new AppError('Troca não encontrada ou não está aceita', 404);
        }

        // Atualiza status e realiza a transferência das figurinhas
        await prisma.$transaction(async (tx) => {
            // Atualiza a troca
            await tx.trade.update({
                where: { id },
                data: { status: 'COMPLETED', completedAt: new Date() }
            });

            // Transfere figurinhas oferecidas (sender -> receiver)
            for (const item of trade.items) {
                if (item.offeredId) {
                    // Diminui do sender
                    const senderSticker = await tx.userSticker.findFirst({
                        where: { userId: trade.senderId, stickerId: item.offeredId }
                    });
                    if (senderSticker) {
                        if (senderSticker.quantity <= 1) {
                            await tx.userSticker.delete({ where: { id: senderSticker.id } });
                        } else {
                            await tx.userSticker.update({
                                where: { id: senderSticker.id },
                                data: { quantity: senderSticker.quantity - 1 }
                            });
                        }
                    }

                    // Adiciona ao receiver
                    const receiverSticker = await tx.userSticker.findFirst({
                        where: { userId: trade.receiverId, stickerId: item.offeredId }
                    });
                    if (receiverSticker) {
                        await tx.userSticker.update({
                            where: { id: receiverSticker.id },
                            data: { quantity: receiverSticker.quantity + 1 }
                        });
                    } else {
                        await tx.userSticker.create({
                            data: {
                                userId: trade.receiverId,
                                stickerId: item.offeredId,
                                quantity: 1,
                                forTrade: true
                            }
                        });
                    }

                    // Remove da lista de desejadas do receiver
                    await tx.userWantedSticker.deleteMany({
                        where: { userId: trade.receiverId, stickerId: item.offeredId }
                    });
                }

                if (item.requestedId) {
                    // Diminui do receiver
                    const receiverSticker = await tx.userSticker.findFirst({
                        where: { userId: trade.receiverId, stickerId: item.requestedId }
                    });
                    if (receiverSticker) {
                        if (receiverSticker.quantity <= 1) {
                            await tx.userSticker.delete({ where: { id: receiverSticker.id } });
                        } else {
                            await tx.userSticker.update({
                                where: { id: receiverSticker.id },
                                data: { quantity: receiverSticker.quantity - 1 }
                            });
                        }
                    }

                    // Adiciona ao sender
                    const senderSticker = await tx.userSticker.findFirst({
                        where: { userId: trade.senderId, stickerId: item.requestedId }
                    });
                    if (senderSticker) {
                        await tx.userSticker.update({
                            where: { id: senderSticker.id },
                            data: { quantity: senderSticker.quantity + 1 }
                        });
                    } else {
                        await tx.userSticker.create({
                            data: {
                                userId: trade.senderId,
                                stickerId: item.requestedId,
                                quantity: 1,
                                forTrade: true
                            }
                        });
                    }

                    // Remove da lista de desejadas do sender
                    await tx.userWantedSticker.deleteMany({
                        where: { userId: trade.senderId, stickerId: item.requestedId }
                    });
                }
            }
        });

        // Notifica ambos
        const otherUserId = trade.senderId === req.userId ? trade.receiverId : trade.senderId;
        await prisma.notification.create({
            data: {
                userId: otherUserId,
                type: 'TRADE_COMPLETED',
                title: 'Troca concluída!',
                message: `A troca com ${req.user?.nickname} foi marcada como concluída. Que tal avaliar?`,
                data: { tradeId: trade.id }
            }
        });

        res.json({
            success: true,
            message: 'Troca concluída com sucesso! As figurinhas foram transferidas.'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/trades/:id/cancel - Cancelar troca
tradeRouter.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const trade = await prisma.trade.findFirst({
            where: {
                id,
                senderId: req.userId,
                status: 'PENDING'
            }
        });

        if (!trade) {
            throw new AppError('Troca não encontrada ou você não pode cancelar', 404);
        }

        await prisma.trade.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        res.json({
            success: true,
            message: 'Proposta de troca cancelada.'
        });
    } catch (error) {
        next(error);
    }
});
