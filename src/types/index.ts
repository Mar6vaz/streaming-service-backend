import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface IJwtPayload extends JwtPayload {
  user_id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: IJwtPayload;
}

export interface ISubscriptionResponse {
  active: boolean;
  plan: string | null;
  maxQuality: '480p' | '720p' | '1080p';
}

export interface ITrailerWatchedPayload {
  user_id: string;
  movie_id: string;
  trailer_id: string;
  trailer_url: string;
  completed: boolean;
  progress_sec: number;
  duration_sec: number;
  genres: string[];
}

export interface IS3UploadResult {
  url: string;
  key: string;
}