import { Response } from 'express';
import { AuthRequest } from '../types';
import Trailer from '../models/Trailer';
import { uploadToS3, deleteFromS3 } from '../services/s3Service';
import { getDurationFromBuffer } from '../utils/ffprobe';
import { getUserSubscription } from '../services/subscriptionService';

const QUALITY_LEVELS: Record<string, number> = { '480p': 1, '720p': 2, '1080p': 3 };

// GET /trailers/:movieId
export const getTrailer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const authToken = req.headers.authorization!.split(' ')[1];

    const subscription = await getUserSubscription(req.user!.user_id, authToken);
    if (!subscription.active) {
      res.status(403).json({ error: 'Suscripción inactiva o plan insuficiente para la calidad solicitada' });
      return;
    }

    const trailer = await Trailer.findOne({ movie_id: movieId, is_active: true });
    if (!trailer) {
      res.status(404).json({ error: 'Trailer no encontrado' });
      return;
    }

    const trailerLevel = QUALITY_LEVELS[trailer.quality] ?? 1;
    const userLevel = QUALITY_LEVELS[subscription.maxQuality] ?? 1;
    const effectiveQuality = trailerLevel <= userLevel ? trailer.quality : subscription.maxQuality;

    res.status(200).json({
      trailer_id: trailer._id,
      movie_id: trailer.movie_id,
      title: trailer.title,
      trailer_url: trailer.trailer_url,
      duration_sec: trailer.duration_sec,
      quality: effectiveQuality,
    });
  } catch (error) {
    console.error('getTrailer error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /trailers
export const createTrailer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movie_id, title, quality } = req.body;

    const existing = await Trailer.findOne({ movie_id, is_active: true });
    if (existing) {
      res.status(409).json({ error: 'Esta película ya tiene un trailer. Usa PATCH para reemplazarlo.' });
      return;
    }

    const { url, key } = await uploadToS3(req.file!.buffer, movie_id);
    const duration_sec = await getDurationFromBuffer(req.file!.buffer);

    const trailer = await Trailer.create({ movie_id, title, trailer_url: url, s3_key: key, duration_sec, quality });

    res.status(201).json({
      trailer_id: trailer._id,
      movie_id: trailer.movie_id,
      trailer_url: trailer.trailer_url,
      quality: trailer.quality,
      duration_sec: trailer.duration_sec,
    });
  } catch (error) {
    console.error('createTrailer error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /trailers/:movieId
export const updateTrailer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;

    const trailer = await Trailer.findOne({ movie_id: movieId, is_active: true });
    if (!trailer) {
      res.status(404).json({ error: 'Trailer no encontrado' });
      return;
    }

    if (req.body.title) trailer.title = req.body.title;
    if (req.body.quality) trailer.quality = req.body.quality;

    if (req.file) {
      await deleteFromS3(trailer.s3_key);
      const { url, key } = await uploadToS3(req.file.buffer, movieId);
      const duration_sec = await getDurationFromBuffer(req.file.buffer);
      trailer.trailer_url = url;
      trailer.s3_key = key;
      trailer.duration_sec = duration_sec;
    }

    await trailer.save();

    res.status(200).json({
      trailer_id: trailer._id,
      movie_id: trailer.movie_id,
      title: trailer.title,
      trailer_url: trailer.trailer_url,
      duration_sec: trailer.duration_sec,
      quality: trailer.quality,
      is_active: trailer.is_active,
    });
  } catch (error) {
    console.error('updateTrailer error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /trailers/:movieId
export const deleteTrailer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;

    const trailer = await Trailer.findOne({ movie_id: movieId, is_active: true });
    if (!trailer) {
      res.status(404).json({ error: 'Trailer no encontrado' });
      return;
    }

    await deleteFromS3(trailer.s3_key);
    await Trailer.deleteOne({ _id: trailer._id });

    res.status(200).json({ message: 'Trailer eliminado exitosamente' });
  } catch (error) {
    console.error('deleteTrailer error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
