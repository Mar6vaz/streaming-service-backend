require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { consumeUserDeleted } = require('./events/consumers');
const streamingRoutes = require('./routes/streaming');

const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'streaming-service' }));

// Rutas del servicio
app.use('/streaming', streamingRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8003;

const start = async () => {
  await connectDB();
  await connectRabbitMQ();
  await consumeUserDeleted();

  app.listen(PORT, () => {
    console.log(`[streaming-service] Running on port ${PORT}`);
  });
};

start();
