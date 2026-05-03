import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Load environment variables
dotenv.config()

// Import middleware
import { errorHandler, notFound, asyncHandler } from './middlewares/errorMiddleware'
import { rateLimiter } from './middlewares/rateLimiter'
import { requestLogger } from './middlewares/logger'
import cookieParser from 'cookie-parser'

// Import routes
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import studentRoutes from './routes/studentRoutes'
import observationRoutes from './routes/observationRoutes'
import communicationRoutes from './routes/communicationRoutes'
import attendanceRoutes from './routes/attendanceRoutes'
import eventRoutes from './routes/eventRoutes'
import materialRoutes from './routes/materialRoutes'
import syncRoutes from './routes/syncRoutes'

// Import services
import { initializeDatabase } from './services/database'
import { initializeRedis } from './services/redis'
import { initializeSMS } from './services/sms'

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3001

// Create HTTP server for WebSocket
const httpServer = createServer(app)

// Initialize WebSocket for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  pingTimeout: 60000,
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)
app.use(rateLimiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Montessori Mafikeng Connect API',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/observations', observationRoutes)
app.use('/api/communications', communicationRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/sync', syncRoutes)

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id)

  // Join user to their room for private notifications
  socket.on('join-user', (userId: string) => {
    socket.join(`user:${userId}`)
    console.log(`User ${userId} joined their room`)
  })

  // Join classroom room for class updates
  socket.on('join-classroom', (classroomId: string) => {
    socket.join(`classroom:${classroomId}`)
    console.log(`Socket ${socket.id} joined classroom ${classroomId}`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected:', socket.id)
  })
})

// Make io available to routes
app.set('io', io)

// Error handling
app.use(notFound)
app.use(errorHandler)

// Initialize services and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase()
    console.log('✅ Database connected successfully')

    // Initialize Redis (non-blocking — server runs without it)
    try {
      await initializeRedis()
      console.log('✅ Redis connected successfully')
    } catch (redisError) {
      console.warn('⚠️ Redis unavailable, continuing without cache:', (redisError as Error).message)
    }

    // Initialize SMS service
    await initializeSMS()
    console.log('✅ SMS service initialized')

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🦁 Montessori Mafikeng Connect - African EdTech Platform`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Start the server
startServer()

export { app, io }