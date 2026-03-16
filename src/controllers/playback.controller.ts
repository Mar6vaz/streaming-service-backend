import { Request, Response } from 'express';
import * as PlaybackService from '../services/playback.service';

// ── 1. POST /api/v1/playback/:movieId/watch
// Registrar inicio de reproducción
export const startPlayback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const { device } = req.body;
    const user_id = req.user!.id;

   
    const { trailer_id } = req.body;

    if (!trailer_id) {
      res.status(400).json({ error: 'trailer_id es requerido' });
      return;
    }

    const result = await PlaybackService.startPlayback({
      user_id,
      movie_id: movieId,
      trailer_id,
      device,
    });


    res.status(201).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
};

// ── 2. PATCH /api/v1/playback/watch/:watchId
// Actualizar progreso de reproducción

export const updateProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { watchId } = req.params;
    const { progress_sec, completed } = req.body;
    const user_id = req.user!.id;

    if (progress_sec === undefined || completed === undefined) {
      res.status(400).json({ error: 'progress_sec y completed son requeridos' });
      return;
    }

    const result = await PlaybackService.updateProgress({
      watch_id: watchId,
      user_id,
      progress_sec,
      completed,
    });

    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
};

// ── 3. GET /api/v1/playback/history 
// Ver historial de reproducción del usuario autenticado
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let completed: boolean | undefined;
    if (req.query.completed !== undefined) {
      completed = req.query.completed === 'true';
    }

    const result = await PlaybackService.getHistory({ user_id, page, limit, completed });

    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
};

// ── 4. DELETE /api/v1/playback/history 
// Limpiar TODO el historial del usuario autenticado

export const clearHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user!.id;

    const result = await PlaybackService.clearHistory(user_id);

    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
};
