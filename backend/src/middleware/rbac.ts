import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
            return;
        }

        next();
    };
};

/**
 * Middleware shortcuts for common role checks
 */
export const requireAdmin = requireRole(['admin']);
export const requireAnalyst = requireRole(['admin', 'analyst']);
export const requireViewer = requireRole(['admin', 'analyst', 'viewer']);

export default requireRole;
