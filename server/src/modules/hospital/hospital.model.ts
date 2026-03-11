import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
  user: mongoose.Types.ObjectId;
  hospitalName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  specialties: string[];
  totalBeds: number;
  availableBeds: number;
  emergencyCapacity: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    specialties: {
      type: [String],
      default: [],
    },
    totalBeds: {
      type: Number,
      default: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
    },
    emergencyCapacity: {
      type: Boolean,
      default: true,
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
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model<IHospital>('Hospital', hospitalSchema);
export default Hospital;
