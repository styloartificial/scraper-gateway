const express = require('express');
const { checkSecretKey } = require('../middleware/auth');
const productSearchService = require('../services/productSearchService');

const router = express.Router();

// search_query bisa dikirim lewat query string, dengan default supaya
// endpoint tetap bisa dites langsung dari browser seperti versi lama.
router.get('/search-products', checkSecretKey, async (req, res) => {
  const searchQuery = req.query.search_query || 'Baju Koko';
  const marketplace = req.query.marketplace || 'id';

  const products = await productSearchService.searchProducts({
    search_query: searchQuery,
    marketplace,
  });

  res.json(products);
});

module.exports = router;
