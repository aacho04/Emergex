import { Request, Response, NextFunction } from 'express';
import userService from './user.service';
import { UserRole } from '../../constants/roles';

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.query;
      const users = await userService.getAllUsers(role as UserRole | undefined);
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deactivateUser(req.params.id);
      res.json({ success: true, message: 'User deactivated' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.activateUser(req.params.id);
      res.json({ success: true, message: 'User activated' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getERSOfficers(req: Request, res: Response, next: NextFunction) {
    try {
      const officers = await userService.getERSOfficers();
      res.json({ success: true, data: officers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await userService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new UserController();
