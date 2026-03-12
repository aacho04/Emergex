import mongoose, { Document, Schema } from 'mongoose';
import { AmbulanceStatus, DutyStatus } from '../../constants/roles';

export interface IAmbulance extends Document {
  user: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  dutyStatus: DutyStatus;
  ambulanceStatus: AmbulanceStatus;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  currentEmergency?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ambulanceSchema = new Schema<IAmbulance>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
      trim: true,
    },
    dutyStatus: {
      type: String,
      enum: Object.values(DutyStatus),
      default: DutyStatus.OFF_DUTY,
    },
    ambulanceStatus: {
      type: String,
      enum: Object.values(AmbulanceStatus),
      default: AmbulanceStatus.OFF_DUTY,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    currentEmergency: {
      type: Schema.Types.ObjectId,
      ref: 'Emergency',
    },
  },
  {
    timestamps: true,
  }
);

ambulanceSchema.index({ currentLocation: '2dsphere' });
ambulanceSchema.index({ dutyStatus: 1, ambulanceStatus: 1 });

const Ambulance = mongoose.model<IAmbulance>('Ambulance', ambulanceSchema);
export default Ambulance;
