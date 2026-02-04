import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { generateToken } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('role').optional().isIn(['admin', 'analyst', 'viewer'])
    ],
    async (req: Request, res: Response): Promise<void> => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password, role = 'viewer' } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                res.status(409).json({ error: 'User already exists' });
                return;
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const user = await User.create({
                email,
                passwordHash,
                role
            });

            // Generate token
            const token = generateToken(user.id);

            logger.info(`New user registered: ${email}`);

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                token
            });
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req: Request, res: Response): Promise<void> => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { email } });
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Generate token
            const token = generateToken(user.id);

            logger.info(`User logged in: ${email}`);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                token
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    }
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ error: 'Token required' });
            return;
        }

        // In a production app, you'd verify the old token and check a refresh token
        // For simplicity, we'll just generate a new token
        const decoded = require('jsonwebtoken').verify(
            token,
            process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
        ) as { userId: number };

        const newToken = generateToken(decoded.userId);

        res.json({ token: newToken });
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
});

export default router;
