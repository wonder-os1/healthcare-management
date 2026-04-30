import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err)

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'A record with this value already exists',
      })
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      })
    }
  }

  const statusCode = (err as any).statusCode || 500
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message

  res.status(statusCode).json({
    success: false,
    error: message,
  })
}
