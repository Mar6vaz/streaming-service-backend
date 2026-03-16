import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';

ffmpeg.setFfprobePath('/usr/bin/ffprobe');

export const getDurationFromBuffer = (buffer: Buffer): Promise<number> => {
  return new Promise((resolve) => {
    const tmpPath = path.join(os.tmpdir(), `trailer_${Date.now()}.mp4`);

    fs.writeFile(tmpPath, buffer, (writeErr) => {
      if (writeErr) {
        console.error('⚠️  Error escribiendo archivo temporal:', writeErr.message);
        return resolve(0);
      }

      ffmpeg.ffprobe(tmpPath, (err, metadata) => {
        fs.unlink(tmpPath, () => {});

        if (err) {
          console.error('⚠️  ffprobe error:', err.message);
          return resolve(0);
        }

        const duration = Math.round(metadata.format.duration ?? 0);
        resolve(duration);
      });
    });
  });
};