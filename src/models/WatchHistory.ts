import { Schema, model, Document, Types } from 'mongoose';

export interface IWatchHistory extends Document {
  user_id: string;
  movie_id: string;
  trailer_id: Types.ObjectId;
  watched_at: Date;
  progress_sec: number;
  completed: boolean;
  device: 'web' | 'mobile' | 'tv';
  rating_prompted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const watchHistorySchema = new Schema<IWatchHistory>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    movie_id: {
      type: String,
      required: true,
    },
    trailer_id: {
      type: Schema.Types.ObjectId,
      ref: 'Trailer',
      required: true,
    },
    watched_at: {
      type: Date,
      default: Date.now,
    },
    progress_sec: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    device: {
      type: String,
      enum: ['web', 'mobile', 'tv'],
      default: 'web',
    },
    rating_prompted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'watch_history',
  }
);

export default model<IWatchHistory>('WatchHistory', watchHistorySchema);
