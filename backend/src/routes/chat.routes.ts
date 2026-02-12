import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

export const chatRouter = Router();

// GET /api/chat/conversations - Lista as conversas do usuário
chatRouter.get('/conversations', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: req.userId },
                    { user2Id: req.userId }
                ]
            },
            include: {
                user1: {
                    select: { id: true, name: true, nickname: true, avatarUrl: true }
                },
                user2: {
                    select: { id: true, name: true, nickname: true, avatarUrl: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Formata para retornar o "outro" usuário e última mensagem
        const formattedConversations = conversations.map(conv => {
            const otherUser = conv.user1Id === req.userId ? conv.user2 : conv.user1;
            const lastMessage = conv.messages[0] || null;
            
            return {
                id: conv.id,
                otherUser,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isRead: lastMessage.isRead,
                    isMine: lastMessage.senderId === req.userId
                } : null,
                updatedAt: conv.updatedAt
            };
        });

        // Conta mensagens não lidas
        const unreadCount = await prisma.message.count({
            where: {
                conversation: {
                    OR: [
                        { user1Id: req.userId },
                        { user2Id: req.userId }
                    ]
                },
                senderId: { not: req.userId },
                isRead: false
            }
        });

        res.json({
            success: true,
            data: formattedConversations,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/chat/conversations/:id - Obtém mensagens de uma conversa
chatRouter.get('/conversations/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                OR: [
                    { user1Id: req.userId },
                    { user2Id: req.userId }
                ]
            },
            include: {
                user1: {
                    select: { id: true, name: true, nickname: true, avatarUrl: true }
                },
                user2: {
                    select: { id: true, name: true, nickname: true, avatarUrl: true }
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, name: true, nickname: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        if (!conversation) {
            throw new AppError('Conversa não encontrada', 404);
        }

        // Marca mensagens como lidas
        await prisma.message.updateMany({
            where: {
                conversationId: id,
                senderId: { not: req.userId },
                isRead: false
            },
            data: { isRead: true }
        });

        const otherUser = conversation.user1Id === req.userId ? conversation.user2 : conversation.user1;

        res.json({
            success: true,
            data: {
                id: conversation.id,
                otherUser,
                messages: conversation.messages.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    createdAt: msg.createdAt,
                    isRead: msg.isRead,
                    isMine: msg.senderId === req.userId,
                    sender: msg.sender
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/chat/conversations - Cria ou obtém conversa com um usuário
chatRouter.post('/conversations', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            throw new AppError('ID do usuário é obrigatório', 400);
        }

        if (userId === req.userId) {
            throw new AppError('Não é possível iniciar conversa consigo mesmo', 400);
        }

        // Verifica se usuário existe
        const otherUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, nickname: true, avatarUrl: true }
        });

        if (!otherUser) {
            throw new AppError('Usuário não encontrado', 404);
        }

        // Ordena IDs para garantir unicidade
        const [user1Id, user2Id] = [req.userId!, userId].sort();

        // Tenta encontrar conversa existente ou cria nova
        let conversation = await prisma.conversation.findUnique({
            where: {
                user1Id_user2Id: { user1Id, user2Id }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { user1Id, user2Id }
            });
        }

        res.json({
            success: true,
            data: {
                conversationId: conversation.id,
                otherUser
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/chat/conversations/:id/messages - Envia mensagem
chatRouter.post('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            throw new AppError('Mensagem não pode estar vazia', 400);
        }

        // Verifica se conversa existe e usuário participa
        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                OR: [
                    { user1Id: req.userId },
                    { user2Id: req.userId }
                ]
            }
        });

        if (!conversation) {
            throw new AppError('Conversa não encontrada', 404);
        }

        // Cria mensagem
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                senderId: req.userId!,
                content: content.trim()
            },
            include: {
                sender: {
                    select: { id: true, name: true, nickname: true, avatarUrl: true }
                }
            }
        });

        // Atualiza updatedAt da conversa
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        // Cria notificação para o outro usuário
        const otherUserId = conversation.user1Id === req.userId ? conversation.user2Id : conversation.user1Id;
        
        const sender = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { nickname: true }
        });

        await prisma.notification.create({
            data: {
                userId: otherUserId,
                type: 'NEW_MESSAGE',
                title: 'Nova mensagem',
                message: `@${sender?.nickname} enviou uma mensagem`,
                data: { conversationId: id }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                isRead: message.isRead,
                isMine: true,
                sender: message.sender
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/chat/user/:nickname - Obtém ou cria conversa por nickname
chatRouter.get('/user/:nickname', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { nickname } = req.params;

        const otherUser = await prisma.user.findUnique({
            where: { nickname },
            select: { id: true, name: true, nickname: true, avatarUrl: true }
        });

        if (!otherUser) {
            throw new AppError('Usuário não encontrado', 404);
        }

        if (otherUser.id === req.userId) {
            throw new AppError('Não é possível iniciar conversa consigo mesmo', 400);
        }

        // Ordena IDs para garantir unicidade
        const [user1Id, user2Id] = [req.userId!, otherUser.id].sort();

        // Tenta encontrar conversa existente ou cria nova
        let conversation = await prisma.conversation.findUnique({
            where: {
                user1Id_user2Id: { user1Id, user2Id }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { user1Id, user2Id }
            });
        }

        res.json({
            success: true,
            data: {
                conversationId: conversation.id,
                otherUser
            }
        });
    } catch (error) {
        next(error);
    }
});
