import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ext !== '.mp4' || mime !== 'video/mp4') {
    cb(new Error('Archivo no es MP4'));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const handleMulterError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo supera el límite de 500MB' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err?.message === 'Archivo no es MP4') {
    res.status(400).json({ error: 'Archivo no es MP4' });
    return;
  }
  next(err);
};
