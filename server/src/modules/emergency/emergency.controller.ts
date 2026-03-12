import { Request, Response, NextFunction } from 'express';
import emergencyService from './emergency.service';
import { z } from 'zod';
import { PatientCondition, EmergencyStatus } from '../../constants/roles';

const createEmergencySchema = z.object({
  callerPhone: z.string().min(1, 'Caller phone is required'),
  patientName: z.string().optional(),
  patientCondition: z.nativeEnum(PatientCondition).optional(),
  description: z.string().optional(),
});

const setLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

const receiveLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export class EmergencyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createEmergencySchema.parse(req.body);
      const userId = (req as any).user.id;
      const emergency = await emergencyService.create({
        ...data,
        assignedBy: userId,
      });
      res.status(201).json({ success: true, data: emergency });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendLocationSMS(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const result = await emergencyService.sendLocationSMS(id, clientUrl);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async receiveLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { latitude, longitude } = receiveLocationSchema.parse(req.body);
      const emergency = await emergencyService.receiveLocationFromLink(token, latitude, longitude);
      res.json({ success: true, message: 'Location received successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async setManualLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { latitude, longitude, address } = setLocationSchema.parse(req.body);
      const emergency = await emergencyService.setManualLocation(id, latitude, longitude, address);
      res.json({ success: true, data: emergency });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async dispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const emergency = await emergencyService.dispatch(id, userId);
      res.json({ success: true, data: emergency });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const emergencies = await emergencyService.getAll({
        status: status as EmergencyStatus | undefined,
      });
      res.json({ success: true, data: emergencies });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const emergency = await emergencyService.getById(req.params.id);
      if (!emergency) {
        return res.status(404).json({ success: false, message: 'Emergency not found' });
      }
      res.json({ success: true, data: emergency });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyEmergencies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;

      let emergencies;
      if (role === 'ambulance') {
        emergencies = await emergencyService.getByAmbulance(userId);
      } else if (role === 'traffic_police') {
        emergencies = await emergencyService.getByTrafficPolice(userId);
      } else {
        emergencies = await emergencyService.getAll();
      }

      res.json({ success: true, data: emergencies });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await emergencyService.getStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new EmergencyController();
