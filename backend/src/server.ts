import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { stickerRouter } from './routes/sticker.routes.js';
import { tradeRouter } from './routes/trade.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { matchRouter } from './routes/match.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Rotas
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/stickers', stickerRouter);
app.use('/api/trades', tradeRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/match', matchRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📚 API disponível em http://localhost:${PORT}/api`);
});

export default app;
