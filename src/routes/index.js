const express = require('express');
const queueRoutes = require('./queue.routes');
const productsRoutes = require('./products.routes');

const router = express.Router();

// Health check, berguna untuk load balancer / uptime monitor, tidak perlu auth.
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use(queueRoutes);
router.use(productsRoutes);

module.exports = router;
