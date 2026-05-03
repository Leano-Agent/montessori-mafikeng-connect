// Vercel Serverless Entry Point
// Wraps the Express app for Vercel deployment
// Socket.io and file uploads are disabled in serverless mode

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

// Import routes
import authRoutes from '../src/routes/authRoutes'
import userRoutes from '../src/routes/userRoutes'
import studentRoutes from '../src/routes/studentRoutes'
import observationRoutes from '../src/routes/observationRoutes'
import communicationRoutes from '../src/routes/communicationRoutes'
import attendanceRoutes from '../src/routes/attendanceRoutes'
import eventRoutes from '../src/routes/eventRoutes'
import materialRoutes from '../src/routes/materialRoutes'
import syncRoutes from '../src/routes/syncRoutes'

const app = express()

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }))
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/students', studentRoutes)
app.use('/api/v1/observations', observationRoutes)
app.use('/api/v1/communications', communicationRoutes)
app.use('/api/v1/attendance', attendanceRoutes)
app.use('/api/v1/events', eventRoutes)
app.use('/api/v1/materials', materialRoutes)
app.use('/api/v1/sync', syncRoutes)

export default app
