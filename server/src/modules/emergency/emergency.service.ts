import Emergency, { IEmergency } from './emergency.model';
import Ambulance from '../ambulance/ambulance.model';
import TrafficPolice from '../traffic-police/traffic.model';
import Volunteer from '../volunteer/volunteer.model';
import Hospital from '../hospital/hospital.model';
import { AmbulanceStatus, DutyStatus, EmergencyStatus, PatientCondition } from '../../constants/roles';
import { getIO } from '../../config/socket';
import { calculateDistance } from '../../utils/distanceCalculator';

export class EmergencyService {
  async create(data: {
    callerPhone?: string;
    patientName?: string;
    patientCondition: PatientCondition;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    assignedBy: string;
    ambulanceId?: string;
    trafficPoliceIds?: string[];
    hospitalId?: string;
  }) {
    const emergency = await Emergency.create({
      callerPhone: data.callerPhone,
      patientName: data.patientName,
      patientCondition: data.patientCondition,
      description: data.description,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
        address: data.address,
      },
      assignedBy: data.assignedBy,
      assignedAmbulance: data.ambulanceId,
      assignedTrafficPolice: data.trafficPoliceIds || [],
      assignedHospital: data.hospitalId,
      status: data.ambulanceId ? EmergencyStatus.ASSIGNED : EmergencyStatus.PENDING,
      timeline: [
        {
          status: EmergencyStatus.PENDING,
          timestamp: new Date(),
          note: 'Emergency created',
          updatedBy: data.assignedBy,
        },
      ],
    });

    // Calculate distances
    if (data.ambulanceId) {
      const ambulance = await Ambulance.findById(data.ambulanceId);
      if (ambulance) {
        emergency.distanceToAmbulance = calculateDistance(
          data.latitude,
          data.longitude,
          ambulance.currentLocation.coordinates[1],
          ambulance.currentLocation.coordinates[0]
        );

        // Mark ambulance as busy
        ambulance.ambulanceStatus = AmbulanceStatus.BUSY;
        ambulance.currentEmergency = emergency._id as any;
        await ambulance.save();

        // Notify ambulance
        const io = getIO();
        io.emit('ambulance:alert', {
          ambulanceId: data.ambulanceId,
          emergency: {
            id: emergency._id,
            location: { lat: data.latitude, lng: data.longitude },
            patientCondition: data.patientCondition,
            address: data.address,
          },
        });

        emergency.timeline.push({
          status: EmergencyStatus.ASSIGNED,
          timestamp: new Date(),
          note: 'Ambulance assigned',
          updatedBy: data.assignedBy as any,
        });
      }
    }

    if (data.hospitalId) {
      const hospital = await Hospital.findById(data.hospitalId);
      if (hospital) {
        emergency.distanceToHospital = calculateDistance(
          data.latitude,
          data.longitude,
          hospital.location.coordinates[1],
          hospital.location.coordinates[0]
        );
      }
    }

    // Notify traffic police
    if (data.trafficPoliceIds && data.trafficPoliceIds.length > 0) {
      const io = getIO();
      io.emit('traffic:route-alert', {
        emergencyId: emergency._id,
        trafficPoliceIds: data.trafficPoliceIds,
        message: 'Ambulance dispatched - clear route',
        location: { lat: data.latitude, lng: data.longitude },
      });
    }

    // Activate nearby volunteers
    try {
      const nearbyVolunteers = await Volunteer.find({
        isAvailable: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [data.longitude, data.latitude],
            },
            $maxDistance: 5000,
          },
        },
      }).limit(5);

      if (nearbyVolunteers.length > 0) {
        emergency.activatedVolunteers = nearbyVolunteers.map((v) => v._id as any);
        const io = getIO();
        io.emit('volunteer:activate', {
          emergencyId: emergency._id,
          volunteers: nearbyVolunteers.map((v) => ({
            id: v._id,
            name: v.name,
            phone: v.phone,
          })),
        });
      }
    } catch (err) {
      // Geospatial index may not work if no volunteers have coordinates
    }

    await emergency.save();
    return emergency;
  }

  async getAll(filters?: { status?: EmergencyStatus }) {
    const query: any = {};
    if (filters?.status) query.status = filters.status;

    return Emergency.find(query)
      .populate('assignedBy', 'fullName username')
      .populate('assignedAmbulance')
      .populate('assignedTrafficPolice')
      .populate('assignedHospital')
      .sort({ createdAt: -1 });
  }

  async getById(id: string) {
    return Emergency.findById(id)
      .populate('assignedBy', 'fullName username')
      .populate({
        path: 'assignedAmbulance',
        populate: { path: 'user', select: 'fullName username phone' },
      })
      .populate({
        path: 'assignedTrafficPolice',
        populate: { path: 'user', select: 'fullName username phone' },
      })
      .populate({
        path: 'assignedHospital',
        populate: { path: 'user', select: 'fullName username' },
      })
      .populate('activatedVolunteers');
  }

  async getByAmbulance(ambulanceId: string) {
    const ambulance = await Ambulance.findOne({ user: ambulanceId });
    if (!ambulance) return [];

    return Emergency.find({
      assignedAmbulance: ambulance._id,
      status: { $nin: [EmergencyStatus.COMPLETED, EmergencyStatus.CANCELLED] },
    })
      .populate('assignedHospital')
      .sort({ createdAt: -1 });
  }

  async getByTrafficPolice(userId: string) {
    const tp = await TrafficPolice.findOne({ user: userId });
    if (!tp) return [];

    return Emergency.find({
      assignedTrafficPolice: tp._id,
      status: { $nin: [EmergencyStatus.COMPLETED, EmergencyStatus.CANCELLED] },
    })
      .populate({
        path: 'assignedAmbulance',
        populate: { path: 'user', select: 'fullName phone' },
      })
      .sort({ createdAt: -1 });
  }

  async getStats() {
    const [total, pending, active, completed] = await Promise.all([
      Emergency.countDocuments(),
      Emergency.countDocuments({ status: EmergencyStatus.PENDING }),
      Emergency.countDocuments({
        status: {
          $in: [
            EmergencyStatus.ASSIGNED,
            EmergencyStatus.AMBULANCE_DISPATCHED,
            EmergencyStatus.PATIENT_PICKED_UP,
            EmergencyStatus.EN_ROUTE_HOSPITAL,
          ],
        },
      }),
      Emergency.countDocuments({ status: EmergencyStatus.COMPLETED }),
    ]);

    return { total, pending, active, completed };
  }
}

export default new EmergencyService();
