const express = require('express');
const { checkSecretKey } = require('../middleware/auth');
const queueService = require('../services/queueService');

const router = express.Router();

// Endpoint tetap sama persis seperti versi lama supaya integrasi Laravel
// yang sudah ada tidak perlu diubah.
router.post('/api/add-to-queue-scraper', checkSecretKey, async (req, res) => {
  const queue = await queueService.addToQueue(req.body);
  res.status(200).json({ message: 'Berhasil ditambahkan ke queue', queue });
});

router.post('/api/remove-to-queue-scraper', checkSecretKey, async (req, res) => {
    console.log('=== REMOVE QUEUE ===');
    console.log(req.headers);
    console.log(req.body);

    const queue = await queueService.removeFromQueue(req.body);

    res.status(200).json({
        message: 'Berhasil dihapus',
        queue,
    });
});

router.get('/api/queue', checkSecretKey, async (req, res) => {
  const queue = await queueService.getQueue();
  res.status(200).json(queue);
});

module.exports = router;
