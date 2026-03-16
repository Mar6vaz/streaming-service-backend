import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import { IS3UploadResult } from '../types';

export const uploadToS3 = async (buffer: Buffer, movieId: string): Promise<IS3UploadResult> => {
  const key = `trailers/${movieId}-${uuidv4()}.mp4`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'video/mp4',
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 10,
  });

  await upload.done();

  const url = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  return { url, key };
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key });
  await s3Client.send(command);
};