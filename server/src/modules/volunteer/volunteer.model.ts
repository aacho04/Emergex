import mongoose, { Document, Schema } from 'mongoose';

export interface IVolunteer extends Document {
  name: string;
  phone: string;
  address: string;
  medicalLicenseNumber?: string;
  medicalStudentCollegeId?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  isAvailable: boolean;
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    hospitalId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSchema = new Schema<IVolunteer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    medicalLicenseNumber: {
      type: String,
      trim: true,
    },
    medicalStudentCollegeId: {
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
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    ratings: [
      {
        hospitalId: {
          type: Schema.Types.ObjectId,
          ref: 'Hospital',
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

volunteerSchema.index({ location: '2dsphere' });
volunteerSchema.index({ averageRating: -1 });

const Volunteer = mongoose.model<IVolunteer>('Volunteer', volunteerSchema);
export default Volunteer;
