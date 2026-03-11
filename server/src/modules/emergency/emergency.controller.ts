import { Request, Response, NextFunction } from 'express';
import emergencyService from './emergency.service';
import { z } from 'zod';
import { PatientCondition, EmergencyStatus } from '../../constants/roles';

const createEmergencySchema = z.object({
  callerPhone: z.string().optional(),
  patientName: z.string().optional(),
  patientCondition: z.nativeEnum(PatientCondition),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  ambulanceId: z.string().optional(),
  trafficPoliceIds: z.array(z.string()).optional(),
  hospitalId: z.string().optional(),
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
