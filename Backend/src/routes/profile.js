const express = require('express');
const { getProfile, saveProfile } = require('../services/sqlite');

const router = express.Router();

router.get('/profile', (req, res) => {
  const profile = getProfile();
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

router.post('/profile', (req, res) => {
  const updated = saveProfile(req.body);
  res.json(updated);
});

module.exports = router;
