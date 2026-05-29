const express = require('express');
const {
  syncToFirebase,
  getFirebaseStatus,
} = require('../services/sync');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json(getFirebaseStatus());
});

router.get('/', async (req, res) => {
  try {
    const result = await syncToFirebase();
    res.json(result);
  } catch (err) {
    if (err.code === 'FIREBASE_UNAVAILABLE') {
      return res.status(503).json({
        error: err.message,
        syncEnabled: false,
        ...getFirebaseStatus(),
      });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
