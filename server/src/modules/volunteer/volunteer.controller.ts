import { Request, Response, NextFunction } from 'express';
import Volunteer from './volunteer.model';
import { z } from 'zod';

const volunteerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  medicalLicenseNumber: z.string().optional(),
  medicalStudentCollegeId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const rateVolunteerSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export class VolunteerController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = volunteerFormSchema.parse(req.body);
      const volunteer = await Volunteer.create({
        name: data.name,
        phone: data.phone,
        address: data.address,
        medicalLicenseNumber: data.medicalLicenseNumber,
        medicalStudentCollegeId: data.medicalStudentCollegeId,
        location: {
          type: 'Point',
          coordinates: [data.longitude || 0, data.latitude || 0],
        },
      });
      res.status(201).json({ success: true, data: volunteer });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const volunteers = await Volunteer.find().sort({ averageRating: -1 });
      res.json({ success: true, data: volunteers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const volunteer = await Volunteer.findById(req.params.id);
      if (!volunteer) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }
      res.json({ success: true, data: volunteer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async rateVolunteer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = rateVolunteerSchema.parse(req.body);
      const hospitalUser = (req as any).user;
      const volunteer = await Volunteer.findById(req.params.id);

      if (!volunteer) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }

      volunteer.ratings.push({
        hospitalId: hospitalUser.id,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date(),
      });

      volunteer.totalRatings = volunteer.ratings.length;
      volunteer.averageRating =
        volunteer.ratings.reduce((sum, r) => sum + r.rating, 0) / volunteer.ratings.length;

      await volunteer.save();
      res.json({ success: true, data: volunteer });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, maxDistance } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
      }

      const volunteers = await Volunteer.find({
        isAvailable: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
            },
            $maxDistance: parseInt(maxDistance as string) || 10000,
          },
        },
      }).sort({ averageRating: -1 });

      res.json({ success: true, data: volunteers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new VolunteerController();
