import crypto from 'crypto';
import Emergency, { IEmergency } from './emergency.model';
import Ambulance from '../ambulance/ambulance.model';
import TrafficPolice from '../traffic-police/traffic.model';
import Volunteer from '../volunteer/volunteer.model';
import Hospital from '../hospital/hospital.model';
import { AmbulanceStatus, DutyStatus, EmergencyStatus, PatientCondition } from '../../constants/roles';
import { getIO } from '../../config/socket';
import { calculateDistance } from '../../utils/distanceCalculator';
import { isNearRoute } from '../../utils/routeHelper';
import { sendLocationRequestSMS } from '../../utils/sms';

export class EmergencyService {
  /**
   * Step 1: Create a new emergency with caller phone + basic info.
   * Location is NOT required yet — it will come from SMS link or manual entry.
   */
  async create(data: {
    callerPhone: string;
    patientName?: string;
    patientCondition?: PatientCondition;
    description?: string;
    assignedBy: string;
  }) {
    const emergency = await Emergency.create({
      callerPhone: data.callerPhone,
      patientName: data.patientName,
      patientCondition: data.patientCondition,
      description: data.description,
      assignedBy: data.assignedBy,
      locationConfirmed: false,
      status: EmergencyStatus.PENDING,
      timeline: [
        {
          status: EmergencyStatus.PENDING,
          timestamp: new Date(),
          note: 'Emergency created — awaiting patient location',
          updatedBy: data.assignedBy,
        },
      ],
    });

    return emergency;
  }

  /**
   * Step 2: Send SMS with location link to the caller.
   */
  async sendLocationSMS(emergencyId: string, clientUrl: string) {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) throw new Error('Emergency not found');
    if (!emergency.callerPhone) throw new Error('No caller phone number on record');

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    emergency.smsToken = token;
    emergency.smsTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await emergency.save();

    const locationUrl = `${clientUrl}/share-location/${token}`;
    await sendLocationRequestSMS(emergency.callerPhone, locationUrl);

    // Notify ERS dashboard
    const io = getIO();
    io.emit('emergency:sms-sent', {
      emergencyId: emergency._id,
      message: 'Location SMS sent to caller',
    });

    return { success: true, message: 'SMS sent successfully' };
  }

  /**
   * Step 3a: Receive location from SMS link (public endpoint, no auth).
   */
  async receiveLocationFromLink(token: string, latitude: number, longitude: number) {
    const emergency = await Emergency.findOne({
      smsToken: token,
      smsTokenExpiry: { $gt: new Date() },
    });
    if (!emergency) throw new Error('Invalid or expired location link');

    emergency.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    emergency.locationConfirmed = true;
    emergency.locationSource = 'sms_link';
    emergency.smsToken = undefined;
    emergency.smsTokenExpiry = undefined;
    emergency.timeline.push({
      status: EmergencyStatus.PENDING,
      timestamp: new Date(),
      note: 'Patient location received via SMS link',
    });
    await emergency.save();

    // Notify ERS dashboard in real-time
    const io = getIO();
    io.emit('emergency:location-received', {
      emergencyId: emergency._id,
      location: { lat: latitude, lng: longitude },
      source: 'sms_link',
    });

    return emergency;
  }

  /**
   * Step 3b: ERS manually sets/updates patient location.
   */
  async setManualLocation(emergencyId: string, latitude: number, longitude: number, address?: string) {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) throw new Error('Emergency not found');

    emergency.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address,
    };
    emergency.locationConfirmed = true;
    emergency.locationSource = 'manual';
    emergency.timeline.push({
      status: EmergencyStatus.PENDING,
      timestamp: new Date(),
      note: 'Patient location set manually by ERS',
    });
    await emergency.save();

    const io = getIO();
    io.emit('emergency:location-received', {
      emergencyId: emergency._id,
      location: { lat: latitude, lng: longitude },
      source: 'manual',
    });

    return emergency;
  }

  /**
   * Step 4: DISPATCH — automatically assigns nearest ambulance, nearest hospital,
   * and notifies only traffic police within 1–2 km of the ambulance route.
   */
  async dispatch(emergencyId: string, userId: string) {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) throw new Error('Emergency not found');
    if (!emergency.locationConfirmed) throw new Error('Patient location not confirmed yet');

    const patientLat = emergency.location.coordinates[1];
    const patientLng = emergency.location.coordinates[0];

    // 1. Find nearest available ambulance
    const availableAmbulances = await Ambulance.find({
      dutyStatus: DutyStatus.ON_DUTY,
      ambulanceStatus: AmbulanceStatus.AVAILABLE,
      'currentLocation.coordinates': { $ne: [0, 0] },
    }).populate('user', 'fullName username phone');

    if (availableAmbulances.length === 0) {
      throw new Error('No available ambulances found');
    }

    let nearestAmbulance = availableAmbulances[0];
    let minAmbulanceDistance = Infinity;
    for (const amb of availableAmbulances) {
      const d = calculateDistance(
        patientLat, patientLng,
        amb.currentLocation.coordinates[1],
        amb.currentLocation.coordinates[0]
      );
      if (d < minAmbulanceDistance) {
        minAmbulanceDistance = d;
        nearestAmbulance = amb;
      }
    }

    // 2. Find nearest hospital with available beds
    const hospitals = await Hospital.find({
      isVerified: true,
      emergencyCapacity: true,
      availableBeds: { $gt: 0 },
      'location.coordinates': { $ne: [0, 0] },
    });

    let nearestHospital: any = null;
    let minHospitalDistance = Infinity;
    for (const hosp of hospitals) {
      const d = calculateDistance(
        patientLat, patientLng,
        hosp.location.coordinates[1],
        hosp.location.coordinates[0]
      );
      if (d < minHospitalDistance) {
        minHospitalDistance = d;
        nearestHospital = hosp;
      }
    }

    // 3. Find traffic police within 1–2 km of the ambulance → patient route
    const ambulanceLat = nearestAmbulance.currentLocation.coordinates[1];
    const ambulanceLng = nearestAmbulance.currentLocation.coordinates[0];

    const onDutyTraffic = await TrafficPolice.find({
      dutyStatus: DutyStatus.ON_DUTY,
      'currentLocation.coordinates': { $ne: [0, 0] },
    }).populate('user', 'fullName username phone');

    const routeTrafficPolice = onDutyTraffic.filter((tp) => {
      const tpLat = tp.currentLocation.coordinates[1];
      const tpLng = tp.currentLocation.coordinates[0];
      return isNearRoute(
        { lat: tpLat, lng: tpLng },
        { lat: ambulanceLat, lng: ambulanceLng },
        { lat: patientLat, lng: patientLng },
        2 // 2 km buffer
      );
    });

    // 4. Update emergency record
    emergency.assignedAmbulance = nearestAmbulance._id as any;
    emergency.distanceToAmbulance = Math.round(minAmbulanceDistance * 100) / 100;
    emergency.assignedTrafficPolice = routeTrafficPolice.map((tp) => tp._id as any);

    if (nearestHospital) {
      emergency.assignedHospital = nearestHospital._id;
      emergency.distanceToHospital = Math.round(minHospitalDistance * 100) / 100;
    }

    emergency.status = EmergencyStatus.AMBULANCE_DISPATCHED;
    emergency.timeline.push({
      status: EmergencyStatus.ASSIGNED,
      timestamp: new Date(),
      note: `Auto-assigned ambulance ${nearestAmbulance.vehicleNumber} (${emergency.distanceToAmbulance} km away)`,
      updatedBy: userId as any,
    });
    emergency.timeline.push({
      status: EmergencyStatus.AMBULANCE_DISPATCHED,
      timestamp: new Date(),
      note: `Dispatched. ${routeTrafficPolice.length} traffic officer(s) notified on route.${nearestHospital ? ` Hospital: ${nearestHospital.hospitalName}` : ''}`,
      updatedBy: userId as any,
    });

    await emergency.save();

    // 5. Mark ambulance as busy
    nearestAmbulance.ambulanceStatus = AmbulanceStatus.BUSY;
    nearestAmbulance.currentEmergency = emergency._id as any;
    await nearestAmbulance.save();

    // 6. Emit real-time notifications
    const io = getIO();

    // Alert ambulance with full navigation data (2-phase: ambulance→patient, then ambulance→hospital)
    io.emit('ambulance:alert', {
      ambulanceId: nearestAmbulance._id,
      emergency: {
        id: emergency._id,
        location: { lat: patientLat, lng: patientLng },
        patientCondition: emergency.patientCondition,
        address: emergency.location.address,
        patientName: emergency.patientName,
        callerPhone: emergency.callerPhone,
      },
      hospital: nearestHospital ? {
        id: nearestHospital._id,
        name: nearestHospital.hospitalName,
        location: {
          lat: nearestHospital.location.coordinates[1],
          lng: nearestHospital.location.coordinates[0],
        },
      } : null,
      ambulanceLocation: { lat: ambulanceLat, lng: ambulanceLng },
    });

    // Alert hospital
    if (nearestHospital) {
      io.emit('hospital:incoming', {
        hospitalId: nearestHospital._id,
        emergency: {
          id: emergency._id,
          patientName: emergency.patientName,
          patientCondition: emergency.patientCondition,
          description: emergency.description,
          callerPhone: emergency.callerPhone,
          ambulanceVehicle: nearestAmbulance.vehicleNumber,
          estimatedDistance: emergency.distanceToHospital,
        },
      });
    }

    // Alert only route-relevant traffic police + share ambulance live location
    if (routeTrafficPolice.length > 0) {
      io.emit('traffic:route-alert', {
        emergencyId: emergency._id,
        trafficPoliceIds: routeTrafficPolice.map((tp) => tp._id),
        message: 'Ambulance dispatched — clear route',
        ambulanceId: nearestAmbulance._id,
        ambulanceLocation: { lat: ambulanceLat, lng: ambulanceLng },
        patientLocation: { lat: patientLat, lng: patientLng },
        hospitalLocation: nearestHospital
          ? { lat: nearestHospital.location.coordinates[1], lng: nearestHospital.location.coordinates[0] }
          : null,
      });
    }

    // Activate nearby volunteers with rich data (Uber-like)
    try {
      const nearbyVolunteers = await Volunteer.find({
        isAvailable: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [patientLng, patientLat],
            },
            $maxDistance: 5000,
          },
        },
      }).limit(10);

      if (nearbyVolunteers.length > 0) {
        emergency.activatedVolunteers = nearbyVolunteers.map((v) => v._id as any);
        await emergency.save();

        // Gather nearby ambulance positions for Uber-like display
        const nearbyAmbulancesForVolunteers = availableAmbulances
          .map((amb) => ({
            id: amb._id,
            vehicleNumber: amb.vehicleNumber,
            driverName: amb.driverName,
            location: {
              lat: amb.currentLocation.coordinates[1],
              lng: amb.currentLocation.coordinates[0],
            },
            distance: calculateDistance(
              patientLat, patientLng,
              amb.currentLocation.coordinates[1],
              amb.currentLocation.coordinates[0]
            ),
          }))
          .filter((a) => a.distance <= 10)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);

        // Send rich notification to each volunteer
        for (const vol of nearbyVolunteers) {
          io.emit('volunteer:emergency-alert', {
            emergencyId: emergency._id,
            volunteerId: vol._id,
            patient: {
              name: emergency.patientName,
              condition: emergency.patientCondition,
              location: { lat: patientLat, lng: patientLng },
              address: emergency.location.address,
              callerPhone: emergency.callerPhone,
            },
            assignedAmbulance: {
              id: nearestAmbulance._id,
              vehicleNumber: nearestAmbulance.vehicleNumber,
              driverName: nearestAmbulance.driverName,
              location: {
                lat: ambulanceLat,
                lng: ambulanceLng,
              },
              distance: emergency.distanceToAmbulance,
            },
            hospital: nearestHospital ? {
              name: nearestHospital.hospitalName,
              location: {
                lat: nearestHospital.location.coordinates[1],
                lng: nearestHospital.location.coordinates[0],
              },
            } : null,
            nearbyAmbulances: nearbyAmbulancesForVolunteers,
          });
        }
      }
    } catch (err) {
      // Geospatial index may not work if no volunteers have coordinates
    }

    // Broadcast emergency dispatched
    io.emit('emergency:dispatched', {
      emergencyId: emergency._id,
      ambulance: {
        id: nearestAmbulance._id,
        vehicleNumber: nearestAmbulance.vehicleNumber,
        driverName: nearestAmbulance.driverName,
        distance: emergency.distanceToAmbulance,
      },
      hospital: nearestHospital
        ? {
            id: nearestHospital._id,
            name: nearestHospital.hospitalName,
            distance: emergency.distanceToHospital,
          }
        : null,
      trafficPoliceCount: routeTrafficPolice.length,
    });

    return emergency.populate([
      { path: 'assignedAmbulance', populate: { path: 'user', select: 'fullName phone' } },
      { path: 'assignedHospital' },
      { path: 'assignedTrafficPolice', populate: { path: 'user', select: 'fullName phone' } },
    ]);
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

  /**
   * Update an existing emergency (ERS can edit recent emergencies).
   */
  async updateEmergency(
    emergencyId: string,
    userId: string,
    data: {
      callerPhone?: string;
      patientName?: string;
      patientCondition?: PatientCondition;
      description?: string;
    }
  ) {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) throw new Error('Emergency not found');

    // Only allow editing emergencies that are not completed/cancelled
    if (
      emergency.status === EmergencyStatus.COMPLETED ||
      emergency.status === EmergencyStatus.CANCELLED
    ) {
      throw new Error('Cannot edit a completed or cancelled emergency');
    }

    if (data.callerPhone !== undefined) emergency.callerPhone = data.callerPhone;
    if (data.patientName !== undefined) emergency.patientName = data.patientName;
    if (data.patientCondition !== undefined) emergency.patientCondition = data.patientCondition;
    if (data.description !== undefined) emergency.description = data.description;

    emergency.timeline.push({
      status: emergency.status,
      timestamp: new Date(),
      note: 'Emergency details updated by ERS',
      updatedBy: userId as any,
    });

    await emergency.save();

    const io = getIO();
    io.emit('emergency:updated', {
      emergencyId: emergency._id,
      message: 'Emergency details updated',
    });

    return emergency;
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
