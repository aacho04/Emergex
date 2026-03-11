import { Request, Response, NextFunction } from 'express';
import TrafficPolice from './traffic.model';
import { DutyStatus } from '../../constants/roles';
import { getIO } from '../../config/socket';
import { calculateDistance } from '../../utils/distanceCalculator';

export class TrafficController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const police = await TrafficPolice.find().populate('user', 'fullName username phone');
      res.json({ success: true, data: police });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOnDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const police = await TrafficPolice.find({
        dutyStatus: DutyStatus.ON_DUTY,
      }).populate('user', 'fullName username phone');
      res.json({ success: true, data: police });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
      }

      const police = await TrafficPolice.find({
        dutyStatus: DutyStatus.ON_DUTY,
      }).populate('user', 'fullName username phone');

      const policeWithDistance = police
        .map((p) => ({
          ...p.toObject(),
          distanceToPatient: Math.round(
            calculateDistance(
              parseFloat(lat as string),
              parseFloat(lng as string),
              p.currentLocation.coordinates[1],
              p.currentLocation.coordinates[0]
            ) * 100
          ) / 100,
        }))
        .sort((a, b) => a.distanceToPatient - b.distanceToPatient);

      res.json({ success: true, data: policeWithDistance });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const profile = await TrafficPolice.findOne({ user: userId }).populate(
        'user',
        'fullName username phone'
      );
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const profile = await TrafficPolice.findOne({ user: userId });
      if (!profile) throw new Error('Profile not found');

      profile.dutyStatus =
        profile.dutyStatus === DutyStatus.ON_DUTY ? DutyStatus.OFF_DUTY : DutyStatus.ON_DUTY;
      await profile.save();

      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { lat, lng } = req.body;

      const profile = await TrafficPolice.findOneAndUpdate(
        { user: userId },
        {
          currentLocation: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        },
        { new: true }
      );

      if (profile) {
        const io = getIO();
        io.emit('traffic:location', {
          trafficPoliceId: profile._id,
          location: { lat, lng },
        });
      }

      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new TrafficController();
