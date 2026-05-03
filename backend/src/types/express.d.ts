// Express type extensions for multer support
import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
    }
    
    namespace Multer {
      interface File {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        destination: string
        filename: string
        path: string
        buffer: Buffer
      }
    }
  }
}

// Fix req.query types - allow string[]
interface TypedRequest<T = any> extends Request {
  query: Record<string, string | string[] | undefined>
  params: Record<string, string>
}
