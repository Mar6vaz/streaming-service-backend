const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    movie_id: {
      type: String,
      required: true,
    },
    current_time: {
      type: Number,
      default: 0, // segundos reproducidos
    },
    duration: {
      type: Number,
      default: 0, // duración total del video en segundos
    },
    completed: {
      type: Boolean,
      default: false, // true cuando llega al final
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Índice único: un doc por usuario+película — upsert en cada actualización
progressSchema.index({ user_id: 1, movie_id: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
