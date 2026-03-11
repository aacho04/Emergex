import { Request, Response, NextFunction } from 'express';
import ambulanceService from './ambulance.service';

export class AmbulanceController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const ambulances = await ambulanceService.getAll();
      res.json({ success: true, data: ambulances });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const ambulances = await ambulanceService.getAvailable();
      res.json({ success: true, data: ambulances });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAvailableWithDistance(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
      }
      const ambulances = await ambulanceService.getAvailableWithDistance(
        parseFloat(lat as string),
        parseFloat(lng as string)
      );
      res.json({ success: true, data: ambulances });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyAmbulance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const ambulance = await ambulanceService.getByUserId(userId);
      if (!ambulance) {
        return res.status(404).json({ success: false, message: 'Ambulance not found' });
      }
      res.json({ success: true, data: ambulance });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const ambulance = await ambulanceService.toggleDuty(userId);
      res.json({ success: true, data: ambulance });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { lat, lng } = req.body;
      const ambulance = await ambulanceService.updateLocation(userId, lat, lng);
      res.json({ success: true, data: ambulance });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { status, ...data } = req.body;
      const ambulance = await ambulanceService.updateStatus(userId, status, data);
      res.json({ success: true, data: ambulance });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ambulance = await ambulanceService.getById(req.params.id);
      if (!ambulance) {
        return res.status(404).json({ success: false, message: 'Ambulance not found' });
      }
      res.json({ success: true, data: ambulance });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AmbulanceController();
