import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { upload, handleMulterError } from '../middleware/upload';
import {
  validateCreateTrailer,
  validateUpdateTrailer,
  validateUpdateWatch,
  validateStartWatch,
} from '../middleware/validators';
import { getTrailer, createTrailer, updateTrailer, deleteTrailer } from '../controllers/trailerController';
import { startWatch, updateWatch } from '../controllers/watchController';

const router = Router();

// ─── Watch (antes de /:movieId para evitar conflictos) ────────────────────────
// PATCH /trailers/watch/:watchId
router.patch('/watch/:watchId', authenticate, validateUpdateWatch, updateWatch);

// ─── Trailer CRUD ─────────────────────────────────────────────────────────────
// GET /trailers/:movieId
router.get('/:movieId', authenticate, getTrailer);

// POST /trailers
router.post('/', authenticate, requireAdmin, upload.single('file'), handleMulterError, validateCreateTrailer, createTrailer);

// PATCH /trailers/:movieId
import { Request, Response, NextFunction } from 'express';

// PATCH /trailers/:movieId
router.patch(
  '/:movieId',
  authenticate,
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.includes('multipart/form-data')) {
      upload.single('file')(req, res, next);
    } else {
      next();
    }
  },
  handleMulterError,
  validateUpdateTrailer,
  updateTrailer
);
// DELETE /trailers/:movieId
router.delete('/:movieId', authenticate, requireAdmin, deleteTrailer);

// ─── Watch session ─────────────────────────────────────────────────────────────
// POST /trailers/:movieId/watch
router.post('/:movieId/watch', authenticate, validateStartWatch, startWatch);

export default router;
