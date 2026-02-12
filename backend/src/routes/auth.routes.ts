import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';

export const authRouter = Router();

// Validações
const registerValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('nickname').isLength({ min: 3 }).withMessage('Apelido deve ter no mínimo 3 caracteres')
];

const loginValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
];

// POST /api/auth/register - Cadastro
authRouter.post('/register', registerValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Dados inválidos', 400, errors.array());
        }

        const { email, password, name, nickname, phone, city, state } = req.body;

        // Verifica se email já existe
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            throw new AppError('Este email já está cadastrado', 400);
        }

        // Verifica se nickname já existe
        const existingNickname = await prisma.user.findUnique({ where: { nickname } });
        if (existingNickname) {
            throw new AppError('Este apelido já está em uso', 400);
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria usuário
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                nickname,
                phone,
                city,
                state
            },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                city: true,
                state: true,
                createdAt: true
            }
        });

        // Gera token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            data: { user, token }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login - Login
authRouter.post('/login', loginValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Dados inválidos', 400, errors.array());
        }

        const { email, password } = req.body;

        // Busca usuário
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                nickname: true,
                city: true,
                state: true,
                isActive: true,
                avatarUrl: true
            }
        });

        if (!user || !user.isActive) {
            throw new AppError('Email ou senha inválidos', 401);
        }

        // Verifica senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new AppError('Email ou senha inválidos', 401);
        }

        // Gera token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Remove senha do retorno
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            data: { user: userWithoutPassword, token }
        });
    } catch (error) {
        next(error);
    }
});
