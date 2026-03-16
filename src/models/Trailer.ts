import { Schema, model, Document } from 'mongoose';

export interface ITrailer extends Document {
  movie_id: string;
  title: string;
  trailer_url: string;
  s3_key: string;
  duration_sec: number;
  quality: '480p' | '720p' | '1080p';
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const trailerSchema = new Schema<ITrailer>(
  {
    movie_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    trailer_url: {
      type: String,
      required: true,
    },
    s3_key: {
      type: String,
      required: true,
    },
    duration_sec: {
      type: Number,
      default: 0,
    },
    quality: {
      type: String,
      enum: ['480p', '720p', '1080p'],
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'trailers',
  }
);

export default model<ITrailer>('Trailer', trailerSchema);
