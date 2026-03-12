import { Request, Response, NextFunction } from 'express';
import Volunteer from './volunteer.model';
import Emergency from '../emergency/emergency.model';
import Ambulance from '../ambulance/ambulance.model';
import { EmergencyStatus, AmbulanceStatus, DutyStatus } from '../../constants/roles';
import { getIO } from '../../config/socket';
import { calculateDistance } from '../../utils/distanceCalculator';
import { z } from 'zod';

const REWARD_POINTS_PER_ASSIST = 50;

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
      const volunteers = await Volunteer.find().sort({ rewardPoints: -1, averageRating: -1 });
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

  /**
   * Volunteer accepts an emergency assignment.
   * Awards reward points and links them to the emergency.
   */
  async acceptEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // volunteer ID
      const { emergencyId } = req.body;

      if (!emergencyId) {
        return res.status(400).json({ success: false, message: 'emergencyId is required' });
      }

      const volunteer = await Volunteer.findById(id);
      if (!volunteer) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }

      const emergency = await Emergency.findById(emergencyId);
      if (!emergency) {
        return res.status(404).json({ success: false, message: 'Emergency not found' });
      }

      // Link volunteer to emergency
      volunteer.currentEmergency = emergency._id as any;
      volunteer.isAvailable = false;
      await volunteer.save();

      // Notify ERS + ambulance that a volunteer accepted
      const io = getIO();
      io.emit('volunteer:accepted', {
        emergencyId: emergency._id,
        volunteer: {
          id: volunteer._id,
          name: volunteer.name,
          phone: volunteer.phone,
          location: {
            lat: volunteer.location.coordinates[1],
            lng: volunteer.location.coordinates[0],
          },
        },
      });

      res.json({ success: true, data: volunteer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Mark a volunteer's assistance as complete and award reward points.
   */
  async completeAssist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const volunteer = await Volunteer.findById(id);
      if (!volunteer) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }

      volunteer.rewardPoints += REWARD_POINTS_PER_ASSIST;
      volunteer.emergenciesAssisted += 1;
      volunteer.currentEmergency = undefined;
      volunteer.isAvailable = true;
      await volunteer.save();

      const io = getIO();
      io.emit('volunteer:completed', {
        volunteerId: volunteer._id,
        rewardPoints: volunteer.rewardPoints,
        totalAssists: volunteer.emergenciesAssisted,
      });

      res.json({ success: true, data: volunteer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update volunteer location.
   */
  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      if (latitude == null || longitude == null) {
        return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
      }

      const volunteer = await Volunteer.findByIdAndUpdate(
        id,
        { location: { type: 'Point', coordinates: [longitude, latitude] } },
        { new: true }
      );

      if (!volunteer) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }

      const io = getIO();
      io.emit('volunteer:location', {
        volunteerId: volunteer._id,
        location: { lat: latitude, lng: longitude },
      });

      res.json({ success: true, data: volunteer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get nearby ambulances for a volunteer (Uber-like view).
   */
  async getNearbyAmbulances(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
      }

      const vlat = parseFloat(lat as string);
      const vlng = parseFloat(lng as string);

      const ambulances = await Ambulance.find({
        dutyStatus: DutyStatus.ON_DUTY,
        'currentLocation.coordinates': { $ne: [0, 0] },
      }).populate('user', 'fullName phone');

      const nearby = ambulances
        .map((amb) => ({
          _id: amb._id,
          vehicleNumber: amb.vehicleNumber,
          driverName: amb.driverName,
          ambulanceStatus: amb.ambulanceStatus,
          location: {
            lat: amb.currentLocation.coordinates[1],
            lng: amb.currentLocation.coordinates[0],
          },
          distance: calculateDistance(
            vlat, vlng,
            amb.currentLocation.coordinates[1],
            amb.currentLocation.coordinates[0]
          ),
        }))
        .filter((a) => a.distance <= 10) // within 10 km
        .sort((a, b) => a.distance - b.distance);

      res.json({ success: true, data: nearby });
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

  /**
   * Get volunteer leaderboard sorted by reward points.
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const volunteers = await Volunteer.find({ emergenciesAssisted: { $gt: 0 } })
        .select('name phone rewardPoints emergenciesAssisted averageRating')
        .sort({ rewardPoints: -1 })
        .limit(50);
      res.json({ success: true, data: volunteers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new VolunteerController();
