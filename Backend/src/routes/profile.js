const express = require('express');
const { getProfile, saveProfile } = require('../services/sqlite');
const { isFirebaseEnabled } = require('../services/sync');
const admin = require('firebase-admin');

const router = express.Router();

// Push profile to Firestore
async function syncProfileToFirebase(profileData) {
  if (!isFirebaseEnabled()) return;
  try {
    const firestore = admin.firestore();
    await firestore.collection('profile').doc('company').set({
      ...profileData,
      updatedAt: new Date().toISOString(),
    });
    console.log('[firebase] Profile synced to Firestore');
  } catch (err) {
    console.log('[firebase] Profile sync failed:', err.message);
  }
}

router.get('/profile', (req, res) => {
  const profile = getProfile();
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

router.post('/profile', async (req, res) => {
  const updated = saveProfile(req.body);

  // Auto sync profile to Firebase after save
  syncProfileToFirebase(updated).catch(() => {});

  res.json(updated);
});

module.exports = router;