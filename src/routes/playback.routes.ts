import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  startPlayback,
  updateProgress,
  getHistory,
  clearHistory,
} from '../controllers/playback.controller';

const router = Router();

// POST   /api/v1/trailers/:movieId/watch   Registrar inicio de reproducción
router.post('/:movieId/watch', verifyToken, startPlayback);

// PATCH  /api/v1/trailers/watch/:watchId   Actualizar progreso
router.patch('/watch/:watchId', verifyToken, updateProgress);

// GET    /api/v1/trailers/history          Ver historial
router.get('/history', verifyToken, getHistory);

// DELETE /api/v1/trailers/history          Limpiar historial
router.delete('/history', verifyToken, clearHistory);

export default router;