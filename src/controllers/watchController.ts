import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../types';
import WatchHistory from '../models/WatchHistory';
import Trailer from '../models/Trailer';
import { getUserSubscription } from '../services/subscriptionService';
import { publishTrailerWatched } from '../config/rabbitmq';

export const startWatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const { device } = req.body;
    const authToken = req.headers.authorization!.split(' ')[1];

    const subscription = await getUserSubscription(req.user!.user_id, authToken);
    if (!subscription.active) {
      res.status(403).json({ error: 'Sin suscripción activa' });
      return;
    }

    const trailer = await Trailer.findOne({ movie_id: movieId, is_active: true });
    if (!trailer) {
      res.status(404).json({ error: 'Trailer no encontrado' });
      return;
    }

    const watchEntry = await WatchHistory.create({
      user_id: req.user!.user_id,
      movie_id: movieId,
      trailer_id: trailer._id,
      watched_at: new Date(),
      progress_sec: 0,
      completed: false,
      device: device ?? 'web',
      rating_prompted: false,
    });

    res.status(201).json({
      watch_id: watchEntry._id,
      started_at: watchEntry.watched_at,
    });
  } catch (error) {
    console.error('startWatch error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateWatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { watchId } = req.params;
    const { progress_sec, completed } = req.body;

    const watchEntry = await WatchHistory.findById(watchId);
    if (!watchEntry) {
      res.status(404).json({ error: 'Sesión de reproducción no encontrada' });
      return;
    }

    watchEntry.progress_sec = Number(progress_sec);
    watchEntry.completed = completed === true || completed === 'true';
    await watchEntry.save();

    if (watchEntry.completed) {
      const trailer = await Trailer.findById(watchEntry.trailer_id);

      let genres: string[] = [];
      try {
        const catalogUrl = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:8002';
        const catalogRes = await axios.get(`${catalogUrl}/movies/${watchEntry.movie_id}/genres`, {
          timeout: 2000,
        });
        genres = catalogRes.data.genres ?? [];
      } catch {
        // No bloqueamos si Catalog no responde
      }

      publishTrailerWatched({
        user_id: watchEntry.user_id,
        movie_id: watchEntry.movie_id,
        trailer_id: watchEntry.trailer_id.toString(),
        trailer_url: trailer?.trailer_url ?? '',
        completed: true,
        progress_sec: watchEntry.progress_sec,
        duration_sec: trailer?.duration_sec ?? 0,
        genres,
      });
    }

    res.status(200).json({
      watch_id: watchEntry._id,
      progress_sec: watchEntry.progress_sec,
      completed: watchEntry.completed,
    });
  } catch (error) {
    console.error('updateWatch error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};