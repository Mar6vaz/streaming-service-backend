import { Types } from 'mongoose';
import { WatchHistory } from '../models/watchHistory.model';
import { publishTrailerWatched } from '../config/rabbitmq';

//  Tipos
interface StartPlaybackInput {
  user_id: string;
  movie_id: string;
  trailer_id: string; 
  device?: string;
}

interface UpdateProgressInput {
  watch_id: string;
  user_id: string;
  progress_sec: number;
  completed: boolean;
}

interface GetHistoryInput {
  user_id: string;
  page: number;
  limit: number;
  completed?: boolean;
}

// Registrar inicio de reproducción 
// POST /api/v1/playback/:movieId/watch
export const startPlayback = async (input: StartPlaybackInput) => {
  const { user_id, movie_id, trailer_id, device } = input;

  if (!Types.ObjectId.isValid(trailer_id)) {
    throw { status: 404, message: 'Trailer no encontrado' };
  }

  
  const watchEntry = await WatchHistory.create({
    user_id,
    movie_id,
    trailer_id: new Types.ObjectId(trailer_id),
    progress_sec: 0,
    completed: false,
    device: device || 'web',
  });

  return {
    watch_id: watchEntry._id,
    started_at: watchEntry.started_at,
  };
};

//  Actualizar progreso de reproducción 
// PATCH /api/v1/playback/watch/:watchId
export const updateProgress = async (input: UpdateProgressInput) => {
  const { watch_id, user_id, progress_sec, completed } = input;

  if (!Types.ObjectId.isValid(watch_id)) {
    throw { status: 404, message: 'Sesión de reproducción no encontrada' };
  }

  const watchEntry = await WatchHistory.findOneAndUpdate(
    { _id: watch_id, user_id }, 
    {
      progress_sec,
      completed,
      watched_at: new Date(),
    },
    { new: true }
  );

  if (!watchEntry) {
    throw { status: 404, message: 'Sesión de reproducción no encontrada' };
  }

  // Publicar evento a RabbitMQ cuando el usuario termina el video
  // Solo se publica UNA vez: cuando completed cambia a true
  if (completed) {
    await publishTrailerWatched({
      user_id: watchEntry.user_id,
      movie_id: watchEntry.movie_id,
      trailer_id: watchEntry.trailer_id.toString(),
      watch_id: watchEntry._id.toString(),
      completed_at: new Date().toISOString(),
      device: watchEntry.device,
    });
  }

  return {
    watch_id: watchEntry._id,
    progress_sec: watchEntry.progress_sec,
    completed: watchEntry.completed,
  };
};

// Ver historial de reproducción 
// GET /api/v1/playback/history
export const getHistory = async (input: GetHistoryInput) => {
  const { user_id, page, limit, completed } = input;

 
  const filter: Record<string, unknown> = { user_id };
  if (completed !== undefined) {
    filter.completed = completed;
  }

  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    WatchHistory.find(filter)
      .sort({ watched_at: -1 }) 
      .skip(skip)
      .limit(limit)
      .select('_id movie_id watched_at progress_sec completed device'), 
    WatchHistory.countDocuments(filter),
  ]);

  return {
    history: history.map((h) => ({
      watch_id: h._id,
      movie_id: h.movie_id,
      watched_at: h.watched_at,
      progress_sec: h.progress_sec,
      completed: h.completed,
      device: h.device,
    })),
    total,
  };
};

// Limpiar historial de reproducción 
// DELETE /api/v1/playback/history
export const clearHistory = async (user_id: string) => {

  const result = await WatchHistory.deleteMany({ user_id });

  return {
    message: 'Historial eliminado',
    deleted_count: result.deletedCount,
  };
};
