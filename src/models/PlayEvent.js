const mongoose = require('mongoose');

const playEventSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    movie_id: {
      type: String,
      required: true,
    },
    started_at: {
      type: Date,
      default: Date.now, // momento en que se inició la reproducción
    },
    duration_watched: {
      type: Number,
      default: 0, // segundos efectivamente vistos
    },
    completed: {
      type: Boolean,
      default: false, // true si vió hasta el final
    },
  },
  {
    versionKey: false,
  }
);

// Índices para queries de historial y estadísticas
playEventSchema.index({ movie_id: 1, started_at: -1 });
playEventSchema.index({ user_id: 1, started_at: -1 });

module.exports = mongoose.model('PlayEvent', playEventSchema);
