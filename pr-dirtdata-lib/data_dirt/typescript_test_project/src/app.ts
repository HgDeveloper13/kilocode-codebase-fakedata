import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Импорты маршрутов и middleware
import { errorHandler } from './middleware/errorHandler';
import { logger, requestLogger } from './middleware/logger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';

// Конфигурация окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // ограничение на 100 запросов
  message: {
    error: 'Слишком много запросов с этого IP, пожалуйста, попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use(requestLogger);

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'TypeScript Test Project API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});

// Обработка 404
app.use('*', (req, res) => {
  logger.warn(`404 - Страница не найдена: ${req.originalUrl}`);
  res.status(404).json({
    error: 'Страница не найдена',
    path: req.originalUrl,
    method: req.method
  });
});

// Централизованная обработка ошибок
app.use(errorHandler);

// Запуск сервера
const server = app.listen(PORT, () => {
  logger.info(`Сервер запущен на порту ${PORT}`);
  logger.info(`Режим: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM получен, завершение работы...');
  server.close(() => {
    logger.info('Сервер остановлен');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT получен, завершение работы...');
  server.close(() => {
    logger.info('Сервер остановлен');
    process.exit(0);
  });
});

export default app;