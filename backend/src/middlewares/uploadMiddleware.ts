import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import { AppError } from './errorMiddleware'

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Allowed types: images, audio, PDF, Word documents`, 400))
  }
}

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max 5 files
  }
})

// Single file upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName)
}

// Multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount)
}

// Specific field upload
export const uploadFields = (fields: multer.Field[]) => {
  return upload.fields(fields)
}

// File validation middleware
export const validateFileUpload = (req: Request, res: any, next: any) => {
  if (!req.file && !req.files) {
    return next(new AppError('No files uploaded', 400))
  }
  next()
}

// File compression middleware (placeholder for actual compression logic)
export const compressImages = async (req: Request, res: any, next: any) => {
  // This would integrate with sharp or similar for image compression
  // For now, just pass through
  next()
}

// File cleanup middleware
export const cleanupUploads = async (req: Request, res: any, next: any) => {
  // Clean up uploaded files on error
  const cleanup = () => {
    if (req.file) {
      // Delete single file
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join('uploads', req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    
    if (req.files) {
      // Delete multiple files
      const fs = require('fs')
      const path = require('path')
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat()
      
      files.forEach((file: Express.Multer.File) => {
        const filePath = path.join('uploads', file.filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      })
    }
  }

  // Attach cleanup to response finish
  res.on('finish', cleanup)
  res.on('close', cleanup)
  
  next()
}

// Generate file URL
export const getFileUrl = (filename: string) => {
  if (!filename) return null
  return `${process.env.APP_URL}/uploads/${filename}`
}

// Validate file size
export const validateFileSize = (file: Express.Multer.File, maxSizeMB: number = 10) => {
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    throw new AppError(`File ${file.originalname} exceeds maximum size of ${maxSizeMB}MB`, 400)
  }
  return true
}

// Validate image dimensions
export const validateImageDimensions = async (
  file: Express.Multer.File,
  maxWidth: number = 1920,
  maxHeight: number = 1080
) => {
  if (file.mimetype.startsWith('image/')) {
    // This would use sharp or similar to check dimensions
    // For now, return true
    return true
  }
  return true
}