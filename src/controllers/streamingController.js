const axios = require('axios');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');
const { publishEvent } = require('../config/rabbitmq');
const Progress = require('../models/Progress');
const PlayEvent = require('../models/PlayEvent');
const { decodeTokenInline } = require('../middlewares/auth');


const playMovie = async (req, res) => {
  const { movieId } = req.params;

  // Decodificar JWT manualmente 
  const payload = decodeTokenInline(req);
  if (!payload) {
    return res.status(401).json({ error: 'No autenticado — token ausente o inválido' });
  }

  try {
   
    let movie;
    try {
      const catalogUrl = `${process.env.CATALOG_SERVICE_URL}/movies/${movieId}`;
      const { data } = await axios.get(catalogUrl, { timeout: 5000 });
      movie = data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ error: 'Película no encontrada en catalog / no tiene video_key asignado' });
      }
      throw err;
    }

   
    if (!movie.video_key) {
      return res.status(404).json({ error: 'Película no encontrada en catalog / no tiene video_key asignado' });
    }

  
    if (movie.is_premium && !['premium', 'admin'].includes(payload.role)) {
      return res.status(403).json({ error: 'Se requiere suscripción premium para ver este contenido' });
    }

    // Generar URL firmada de S3 expira en 15 minuto
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: movie.video_key,
    });
    const streamUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    // Registrar reproducción en MongoDB (PlayEvent)
    await PlayEvent.create({
      user_id: payload.id,
      movie_id: String(movie.id),
    });

    // Recuperar progreso guardado del usuario
    const progress = await Progress.findOne({
      user_id: payload.id,
      movie_id: String(movie.id),
    });

    // Publicar evento trailer.watched a RabbitMQ
    await publishEvent('trailer.watched', {
      user_id: payload.id,
      movie_id: movie.id,
      genre_id: movie.genre_id,
      genre_name: movie.genre_name,
      title: movie.title,
    });

    //  Respuesta
    return res.status(200).json({
      streamUrl,
      progress: progress
        ? { current_time: progress.current_time, duration: progress.duration }
        : null,
    });
  } catch (error) {
    console.error('[playMovie] Error:', error.message);
    return res.status(500).json({ error: 'Error interno (S3, MongoDB, catalog)' });
  }
};


const saveProgress = async (req, res) => {
  const { movieId } = req.params;
  const { current_time, duration, completed = false } = req.body;

  try {
    // Upsert del progreso
    await Progress.findOneAndUpdate(
      { user_id: req.user.id, movie_id: movieId },
      { current_time, duration, completed, updated_at: new Date() },
      { upsert: true, new: true }
    );

    // Actualizar el PlayEvent más reciente del usuario para esta película
    await PlayEvent.findOneAndUpdate(
      { user_id: req.user.id, movie_id: movieId },
      { duration_watched: current_time, completed },
      { sort: { started_at: -1 } } // solo el más reciente
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[saveProgress] Error:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
};


const continueWatching = async (req, res) => {
  try {
    const items = await Progress.find({
      user_id: req.user.id,
      current_time: { $gt: 0 },
      completed: false,
    })
      .sort({ updated_at: -1 })
      .limit(20)
      .select('movie_id current_time duration updated_at -_id');

    return res.status(200).json(items);
  } catch (error) {
    console.error('[continueWatching] Error:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
};


const getStats = async (req, res) => {
  try {
    const stats = await PlayEvent.aggregate([
      {
        $group: {
          _id: '$movie_id',
          views: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          avg_duration: { $avg: '$duration_watched' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          movie_id: '$_id',
          views: 1,
          completed: 1,
          avg_duration: { $round: ['$avg_duration', 0] },
        },
      },
    ]);

    return res.status(200).json({ most_watched: stats });
  } catch (error) {
    console.error('[getStats] Error:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { playMovie, saveProgress, continueWatching, getStats };
