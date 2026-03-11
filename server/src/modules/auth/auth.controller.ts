import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import {
  loginSchema,
  registerERSOfficerSchema,
  registerHospitalSchema,
  createAmbulanceSchema,
  createTrafficPoliceSchema,
} from './auth.validation';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async registerERSOfficer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerERSOfficerSchema.parse(req.body);
      const result = await authService.registerERSOfficer(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async registerHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerHospitalSchema.parse(req.body);
      const result = await authService.registerHospital(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createAmbulance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAmbulanceSchema.parse(req.body);
      const result = await authService.createAmbulance(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createTrafficPolice(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTrafficPoliceSchema.parse(req.body);
      const result = await authService.createTrafficPolice(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      res.json({ success: true, data: { user } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();
