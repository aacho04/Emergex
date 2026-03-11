import { Request, Response, NextFunction } from 'express';
import Hospital from './hospital.model';
import { calculateDistance } from '../../utils/distanceCalculator';

export class HospitalController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const hospitals = await Hospital.find({ isVerified: true }).populate(
        'user',
        'fullName username email'
      );
      res.json({ success: true, data: hospitals });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const hospitals = await Hospital.find().populate('user', 'fullName username email isActive');
      res.json({ success: true, data: hospitals });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const hospital = await Hospital.findById(req.params.id).populate(
        'user',
        'fullName username email'
      );
      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }
      res.json({ success: true, data: hospital });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const hospital = await Hospital.findOne({ user: userId }).populate(
        'user',
        'fullName username email'
      );
      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }
      res.json({ success: true, data: hospital });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { availableBeds, totalBeds } = req.body;
      if (availableBeds != null && totalBeds != null && availableBeds > totalBeds) {
        return res.status(400).json({ success: false, message: 'Available beds cannot exceed total beds' });
      }
      if (availableBeds != null && totalBeds == null) {
        const existing = await Hospital.findOne({ user: (req as any).user.id });
        if (existing && availableBeds > existing.totalBeds) {
          return res.status(400).json({ success: false, message: 'Available beds cannot exceed total beds' });
        }
      }
      const userId = (req as any).user.id;
      const hospital = await Hospital.findOneAndUpdate({ user: userId }, req.body, { new: true });
      res.json({ success: true, data: hospital });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
      }

      const hospitals = await Hospital.find({ isVerified: true }).populate(
        'user',
        'fullName username email'
      );

      const hospitalsWithDistance = hospitals
        .map((h) => ({
          ...h.toObject(),
          distanceToPatient: Math.round(
            calculateDistance(
              parseFloat(lat as string),
              parseFloat(lng as string),
              h.location.coordinates[1],
              h.location.coordinates[0]
            ) * 100
          ) / 100,
        }))
        .sort((a, b) => a.distanceToPatient - b.distanceToPatient);

      res.json({ success: true, data: hospitalsWithDistance });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const hospital = await Hospital.findByIdAndUpdate(
        req.params.id,
        { isVerified: true },
        { new: true }
      );
      res.json({ success: true, data: hospital });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new HospitalController();
