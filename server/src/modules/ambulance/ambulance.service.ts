import Ambulance, { IAmbulance } from './ambulance.model';
import Emergency from '../emergency/emergency.model';
import { AmbulanceStatus, DutyStatus, EmergencyStatus } from '../../constants/roles';
import { getIO } from '../../config/socket';
import { calculateDistance } from '../../utils/distanceCalculator';

export class AmbulanceService {
  async getAll() {
    return Ambulance.find().populate('user', 'fullName username phone');
  }

  async getById(id: string) {
    return Ambulance.findById(id).populate('user', 'fullName username phone');
  }

  async getByUserId(userId: string) {
    return Ambulance.findOne({ user: userId }).populate('user', 'fullName username phone');
  }

  async getAvailable() {
    return Ambulance.find({
      dutyStatus: DutyStatus.ON_DUTY,
      ambulanceStatus: AmbulanceStatus.AVAILABLE,
    }).populate('user', 'fullName username phone');
  }

  async getOnDuty() {
    return Ambulance.find({
      dutyStatus: DutyStatus.ON_DUTY,
    }).populate('user', 'fullName username phone');
  }

  async getAvailableWithDistance(patientLat: number, patientLng: number) {
    const ambulances = await Ambulance.find({
      dutyStatus: DutyStatus.ON_DUTY,
    }).populate('user', 'fullName username phone');

    return ambulances.map((amb) => {
      const distance = calculateDistance(
        patientLat,
        patientLng,
        amb.currentLocation.coordinates[1],
        amb.currentLocation.coordinates[0]
      );
      return {
        ...amb.toObject(),
        distanceToPatient: Math.round(distance * 100) / 100,
      };
    }).sort((a, b) => a.distanceToPatient - b.distanceToPatient);
  }

  async toggleDuty(userId: string) {
    const ambulance = await Ambulance.findOne({ user: userId });
    if (!ambulance) throw new Error('Ambulance not found');

    if (ambulance.dutyStatus === DutyStatus.ON_DUTY) {
      ambulance.dutyStatus = DutyStatus.OFF_DUTY;
      ambulance.ambulanceStatus = AmbulanceStatus.OFF_DUTY;
    } else {
      ambulance.dutyStatus = DutyStatus.ON_DUTY;
      ambulance.ambulanceStatus = AmbulanceStatus.AVAILABLE;
    }

    await ambulance.save();
    return ambulance;
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    const ambulance = await Ambulance.findOneAndUpdate(
      { user: userId },
      {
        currentLocation: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
      { new: true }
    );

    if (ambulance) {
      const io = getIO();
      io.emit('ambulance:location', {
        ambulanceId: ambulance._id,
        location: { lat, lng },
      });
    }

    return ambulance;
  }

  async updateStatus(userId: string, status: string, data?: any) {
    const ambulance = await Ambulance.findOne({ user: userId });
    if (!ambulance) throw new Error('Ambulance not found');

    const io = getIO();

    switch (status) {
      case 'picked_up':
        if (ambulance.currentEmergency) {
          await Emergency.findByIdAndUpdate(ambulance.currentEmergency, {
            status: EmergencyStatus.PATIENT_PICKED_UP,
            $push: {
              timeline: {
                status: EmergencyStatus.PATIENT_PICKED_UP,
                timestamp: new Date(),
                note: 'Patient picked up by ambulance',
              },
            },
          });
          io.emit('emergency:status', {
            emergencyId: ambulance.currentEmergency,
            status: EmergencyStatus.PATIENT_PICKED_UP,
          });
        }
        break;

      case 'reached_hospital':
        ambulance.ambulanceStatus = AmbulanceStatus.AVAILABLE;
        ambulance.currentEmergency = undefined;
        await ambulance.save();

        if (data?.emergencyId) {
          await Emergency.findByIdAndUpdate(data.emergencyId, {
            status: EmergencyStatus.REACHED_HOSPITAL,
            completedAt: new Date(),
            $push: {
              timeline: {
                status: EmergencyStatus.REACHED_HOSPITAL,
                timestamp: new Date(),
                note: 'Reached hospital',
              },
            },
          });
          io.emit('emergency:status', {
            emergencyId: data.emergencyId,
            status: EmergencyStatus.REACHED_HOSPITAL,
          });
        }
        break;

      case 'transfer':
        if (data?.newHospitalId && data?.emergencyId) {
          await Emergency.findByIdAndUpdate(data.emergencyId, {
            status: EmergencyStatus.TRANSFERRED,
            transferredToHospital: data.newHospitalId,
            $push: {
              timeline: {
                status: EmergencyStatus.TRANSFERRED,
                timestamp: new Date(),
                note: `Transferring to new hospital`,
              },
            },
          });

          io.emit('emergency:transfer', {
            emergencyId: data.emergencyId,
            newHospitalId: data.newHospitalId,
          });

          io.emit('traffic:route-alert', {
            emergencyId: data.emergencyId,
            message: 'Ambulance transferring patient to new hospital - clear route',
          });
        }
        break;
    }

    return ambulance;
  }
}

export default new AmbulanceService();
