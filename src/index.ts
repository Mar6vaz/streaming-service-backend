import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import playbackRoutes from './routes/playback.routes';


const app = express();
const PORT = process.env.PORT || 8003;

app.use(express.json());

// Rutas de reproducción — /api/v1/trailers (alineado a la documentación)
app.use('/api/v1/trailers', playbackRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'streaming-service', port: PORT });
});

const start = async () => {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`🚀 Streaming Service corriendo en puerto ${PORT}`);
  });
};

start();