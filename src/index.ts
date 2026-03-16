import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import connectDB from './config/database';
import { connectRabbitMQ } from './config/rabbitmq';
import trailerRoutes from './routes/trailerRoutes';

const app = express();
const PORT = process.env.PORT ?? 8003;

// ─── Middlewares globales ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ service: 'streaming-service', status: 'ok', port: PORT });
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/trailers', trailerRoutes);

// ─── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Inicio ───────────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`🚀 Streaming Service corriendo en puerto ${PORT}`);
  });
};

start();
