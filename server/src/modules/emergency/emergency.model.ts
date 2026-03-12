import mongoose, { Document, Schema } from 'mongoose';
import { EmergencyStatus, PatientCondition } from '../../constants/roles';

export type LocationSource = 'sms_link' | 'manual';

export interface IEmergency extends Document {
  callerPhone?: string;
  patientName?: string;
  patientCondition?: PatientCondition;
  description?: string;
  location: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  locationConfirmed: boolean;
  locationSource?: LocationSource;
  smsToken?: string;
  smsTokenExpiry?: Date;
  status: EmergencyStatus;
  assignedBy: mongoose.Types.ObjectId;
  assignedAmbulance?: mongoose.Types.ObjectId;
  assignedTrafficPolice: mongoose.Types.ObjectId[];
  assignedHospital?: mongoose.Types.ObjectId;
  distanceToAmbulance?: number;
  distanceToHospital?: number;
  transferredToHospital?: mongoose.Types.ObjectId;
  activatedVolunteers: mongoose.Types.ObjectId[];
  timeline: Array<{
    status: EmergencyStatus;
    timestamp: Date;
    note?: string;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emergencySchema = new Schema<IEmergency>(
  {
    callerPhone: {
      type: String,
      trim: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    patientCondition: {
      type: String,
      enum: Object.values(PatientCondition),
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: {
        type: String,
        trim: true,
      },
    },
    locationConfirmed: {
      type: Boolean,
      default: false,
    },
    locationSource: {
      type: String,
      enum: ['sms_link', 'manual'],
    },
    smsToken: {
      type: String,
      index: true,
    },
    smsTokenExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(EmergencyStatus),
      default: EmergencyStatus.PENDING,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAmbulance: {
      type: Schema.Types.ObjectId,
      ref: 'Ambulance',
    },
    assignedTrafficPolice: [
      {
        type: Schema.Types.ObjectId,
        ref: 'TrafficPolice',
      },
    ],
    assignedHospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    distanceToAmbulance: {
      type: Number,
    },
    distanceToHospital: {
      type: Number,
    },
    transferredToHospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    activatedVolunteers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Volunteer',
      },
    ],
    timeline: [
      {
        status: {
          type: String,
          enum: Object.values(EmergencyStatus),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1 });
emergencySchema.index({ assignedAmbulance: 1 });
emergencySchema.index({ createdAt: -1 });

const Emergency = mongoose.model<IEmergency>('Emergency', emergencySchema);
export default Emergency;
