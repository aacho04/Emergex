import mongoose, { Document, Schema } from 'mongoose';
import { DutyStatus } from '../../constants/roles';

export interface ITrafficPolice extends Document {
  user: mongoose.Types.ObjectId;
  badgeNumber: string;
  assignedArea: string;
  dutyStatus: DutyStatus;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  currentEmergency?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const trafficPoliceSchema = new Schema<ITrafficPolice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    badgeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    assignedArea: {
      type: String,
      required: true,
      trim: true,
    },
    dutyStatus: {
      type: String,
      enum: Object.values(DutyStatus),
      default: DutyStatus.OFF_DUTY,
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

trafficPoliceSchema.index({ currentLocation: '2dsphere' });
trafficPoliceSchema.index({ dutyStatus: 1 });

const TrafficPolice = mongoose.model<ITrafficPolice>('TrafficPolice', trafficPoliceSchema);
export default TrafficPolice;
