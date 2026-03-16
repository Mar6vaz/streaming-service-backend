import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

export const validateCreateTrailer = [
  body('movie_id')
    .notEmpty().withMessage('movie_id es requerido')
    .isString().withMessage('movie_id debe ser un string válido'),  body('title')
    .notEmpty().withMessage('title es requerido')
    .isString(),
  body('quality')
    .notEmpty().withMessage('quality es requerido')
    .isIn(['480p', '720p', '1080p']).withMessage('quality debe ser 480p, 720p o 1080p'),
  validate,
];

export const validateUpdateTrailer = [
  body('title').optional().isString(),
  body('quality')
    .optional()
    .isIn(['480p', '720p', '1080p']).withMessage('quality debe ser 480p, 720p o 1080p'),
  (req: Request, res: Response, next: NextFunction): void => {
    const hasBody = req.body.title || req.body.quality;
    const hasFile = !!(req as any).file;
    if (!hasBody && !hasFile) {
      res.status(400).json({ error: 'Se requiere al menos un campo para actualizar' });
      return;
    }
    next();
  },
  validate,
];

export const validateUpdateWatch = [
  body('progress_sec')
    .notEmpty().withMessage('progress_sec es requerido')
    .isInt({ min: 0 }).withMessage('progress_sec debe ser un entero positivo'),
  body('completed')
    .notEmpty().withMessage('completed es requerido')
    .isBoolean().withMessage('completed debe ser boolean'),
  validate,
];

export const validateStartWatch = [
  body('device')
    .optional()
    .isIn(['web', 'mobile', 'tv']).withMessage('device debe ser web, mobile o tv'),
  validate,
];
