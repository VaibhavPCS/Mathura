import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import routes from './routes/index.js';
import {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException
} from './libs/error-handler.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
dotenv.config();
handleUncaughtException();

const app = express();

app.use(helmet());

// Rate limiting - Limit requests from same IP
const limiter = rateLimit({
  max: 100,  
  windowMs: 15 * 60 * 1000,  
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  max: 5,  
  windowMs: 15 * 60 * 1000,  
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});
app.use('/api-v1/auth/login', authLimiter);
app.use('/api-v1/auth/register', authLimiter);
app.use('/api-v1/auth/forgot-password', authLimiter);

// Body parser, reading data from body into req.body (with size limits)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL]
  : ['*', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'workspace-id'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Logging middleware (use 'combined' in production)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  // Connection options for better reliability
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

const PORT = process.env.PORT || 5000;


app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
});


import { swaggerDocs } from './libs/swagger.js';

swaggerDocs(app);

app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Welcome to PMS API',
      version: '1.0.0',
      documentation: '/api-docs'
    });
});

app.use('/api-v1', routes);
app.use('/uploads', express.static('uploads'));
app.use(notFoundHandler);
app.use(errorHandler);
handleUnhandledRejection();

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
