const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth');
const {
  playMovie,
  saveProgress,
  continueWatching,
  getStats,
} = require('../controllers/streamingController');

const router = Router();

// GET /streaming/stats — público, sin auth
router.get('/stats', getStats);

// GET /streaming/play/:movieId — premium (JWT inline en controller)
router.get('/play/:movieId', playMovie);

// POST /streaming/progress/:movieId — privado
router.post('/progress/:movieId', authMiddleware, saveProgress);

// GET /streaming/continue-watching — privado
router.get('/continue-watching', authMiddleware, continueWatching);

module.exports = router;
