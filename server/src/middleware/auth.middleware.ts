import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../modules/users/user.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'emergex_jwt_secret'
    ) as any;

    const user = await User.findById(decoded.id).select('-password -emailVerificationToken');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or user deactivated.' });
    }

    req.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
