import { Schema, model, Document, Types } from 'mongoose';

// Interfaz TypeScript
export interface IWatchHistory extends Document {
  user_id: string;           // UUID del usuario (del JWT)
  movie_id: string;          // UUID de la película (del path param)
  trailer_id: Types.ObjectId; // Ref al _id de la colección trailers
  started_at: Date;          // Cuándo inició la reproducción devuelto en el 201
  watched_at: Date;          // Última actualización de progreso (se actualiza en cada PATCH)
  progress_sec: number;      // Segundos reproducidos hasta ahora
  completed: boolean;        // true = terminó el video → dispara evento RabbitMQ
  device: string;            // web | mobile | tv
  rating_prompted: boolean;  // Interno: si ya se mostró el modal de calificación
}


const WatchHistorySchema = new Schema<IWatchHistory>(
  {
    user_id: {
      type: String,
      required: true,
      index: true, 
    },
    movie_id: {
      type: String,
      required: true,
      index: true,
    },
    trailer_id: {
      type: Schema.Types.ObjectId,
      required: true,
   
    },
    started_at: {
      type: Date,
      required: true,
      default: Date.now, 
    },
    watched_at: {
      type: Date,
      default: Date.now, 
    },
    progress_sec: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
      index: true, 
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
    // Mongoose agrega createdAt y updatedAt automáticamente
    timestamps: { createdAt: 'started_at', updatedAt: 'watched_at' },
   
    collection: 'watchhistories',
  }
);

// Índices compuestos 

WatchHistorySchema.index({ user_id: 1, movie_id: 1 });

WatchHistorySchema.index({ user_id: 1, completed: 1 });

export const WatchHistory = model<IWatchHistory>('WatchHistory', WatchHistorySchema);
