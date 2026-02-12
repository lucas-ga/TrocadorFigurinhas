import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode?: number;
    errors?: any[];
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';

    console.error(`[ERROR] ${statusCode} - ${message}`, err);

    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || [],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export class AppError extends Error {
    statusCode: number;
    errors: any[];

    constructor(message: string, statusCode: number = 400, errors: any[] = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
