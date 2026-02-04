import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
    user?: any;
    userId?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

        // Fetch user from database
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: number): string => {
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

export default authenticateToken;
