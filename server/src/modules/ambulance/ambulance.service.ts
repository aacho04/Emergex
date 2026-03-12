import Ambulance, { IAmbulance } from './ambulance.model';
import Emergency from '../emergency/emergency.model';
import Hospital from '../hospital/hospital.model';
import TrafficPolice from '../traffic-police/traffic.model';
import Volunteer from '../volunteer/volunteer.model';
import { AmbulanceStatus, DutyStatus, EmergencyStatus } from '../../constants/roles';
import { getIO } from '../../config/socket';
import { calculateDistance } from '../../utils/distanceCalculator';
import { isNearRoute } from '../../utils/routeHelper';

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

  async toggleDuty(userId: string, lat?: number, lng?: number) {
    const ambulance = await Ambulance.findOne({ user: userId });
    if (!ambulance) throw new Error('Ambulance not found');

    if (ambulance.dutyStatus === DutyStatus.ON_DUTY) {
      ambulance.dutyStatus = DutyStatus.OFF_DUTY;
      ambulance.ambulanceStatus = AmbulanceStatus.OFF_DUTY;
    } else {
      ambulance.dutyStatus = DutyStatus.ON_DUTY;
      ambulance.ambulanceStatus = AmbulanceStatus.AVAILABLE;
      // Update location when going on duty so the ambulance is immediately discoverable
      if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
        ambulance.currentLocation = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
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
          const emergency = await Emergency.findByIdAndUpdate(ambulance.currentEmergency, {
            status: EmergencyStatus.PATIENT_PICKED_UP,
            $push: {
              timeline: {
                status: EmergencyStatus.PATIENT_PICKED_UP,
                timestamp: new Date(),
                note: 'Patient picked up by ambulance',
              },
            },
          }, { new: true }).populate('assignedHospital');

          io.emit('emergency:status', {
            emergencyId: ambulance.currentEmergency,
            status: EmergencyStatus.PATIENT_PICKED_UP,
          });

          // Phase 2: Ambulance → Hospital navigation
          if (emergency?.assignedHospital) {
            const hospital = emergency.assignedHospital as any;
            const hospitalLat = hospital.location.coordinates[1];
            const hospitalLng = hospital.location.coordinates[0];
            const ambLat = ambulance.currentLocation.coordinates[1];
            const ambLng = ambulance.currentLocation.coordinates[0];
            const patientLat = emergency.location.coordinates[1];
            const patientLng = emergency.location.coordinates[0];

            // Emit phase change so all live tracking maps switch to hospital route
            io.emit('ambulance:phase-update', {
              emergencyId: ambulance.currentEmergency,
              ambulanceId: ambulance._id,
              phase: 'to_hospital',
              destination: { lat: hospitalLat, lng: hospitalLng },
              ambulanceLocation: { lat: ambLat, lng: ambLng },
              patientLocation: { lat: patientLat, lng: patientLng },
              hospitalLocation: { lat: hospitalLat, lng: hospitalLng },
              hospital: {
                name: hospital.hospitalName,
                location: { lat: hospitalLat, lng: hospitalLng },
              },
            });

            // Re-alert traffic police along ambulance → hospital route
            try {
              const onDutyTraffic = await TrafficPolice.find({
                dutyStatus: DutyStatus.ON_DUTY,
                'currentLocation.coordinates': { $ne: [0, 0] },
              }).populate('user', 'fullName phone');

              const routeTraffic = onDutyTraffic.filter((tp) => {
                const tpLat = tp.currentLocation.coordinates[1];
                const tpLng = tp.currentLocation.coordinates[0];
                return isNearRoute(
                  { lat: tpLat, lng: tpLng },
                  { lat: ambLat, lng: ambLng },
                  { lat: hospitalLat, lng: hospitalLng },
                  2
                );
              });

              if (routeTraffic.length > 0) {
                io.emit('traffic:route-alert', {
                  emergencyId: emergency._id,
                  trafficPoliceIds: routeTraffic.map((tp) => tp._id),
                  message: 'Ambulance en route to hospital — clear route',
                  phase: 'to_hospital',
                  ambulanceId: ambulance._id,
                  ambulanceLocation: { lat: ambLat, lng: ambLng },
                  patientLocation: {
                    lat: emergency.location.coordinates[1],
                    lng: emergency.location.coordinates[0],
                  },
                  hospitalLocation: { lat: hospitalLat, lng: hospitalLng },
                });
              }
            } catch (err) {
              console.error('Error alerting traffic police for phase 2:', err);
            }

            // Release volunteers — their assistance is done once patient is picked up
            try {
              if (emergency.activatedVolunteers?.length > 0) {
                await Volunteer.updateMany(
                  { _id: { $in: emergency.activatedVolunteers } },
                  { isAvailable: true, $unset: { currentEmergency: 1 } }
                );
              }
            } catch (err) {
              console.error('Error releasing volunteers:', err);
            }
          }
        }
        break;

      case 'reached_hospital': {
        // Capture the emergency ID before clearing it from the ambulance record
        const reachedEmergencyId = data?.emergencyId || ambulance.currentEmergency;
        ambulance.ambulanceStatus = AmbulanceStatus.AVAILABLE;
        ambulance.currentEmergency = undefined;
        await ambulance.save();

        if (reachedEmergencyId) {
          await Emergency.findByIdAndUpdate(reachedEmergencyId, {
            status: EmergencyStatus.REACHED_HOSPITAL,
            completedAt: new Date(),
            $push: {
              timeline: {
                status: EmergencyStatus.REACHED_HOSPITAL,
                timestamp: new Date(),
                note: 'Ambulance reached hospital with patient',
              },
            },
          });
          io.emit('emergency:status', {
            emergencyId: reachedEmergencyId,
            status: EmergencyStatus.REACHED_HOSPITAL,
          });
        }
        break;
      }

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
