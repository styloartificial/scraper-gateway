const axios = require('axios');
const env = require('../config/env');

const CHARTED_SEA_LAZADA_URL = 'https://continuous-scraper.common.chartedapi.com/scraping-tasks/lazada/run';

function formatSearchQuery(searchQuery) {
  return String(searchQuery).trim().replace(/\s+/g, '%20');
}

async function searchProducts({ search_query: searchQuery, marketplace = 'id', limit = 10 }) {
  const authToken = env.chartedSeaApiToken || process.env.AUTH_TOKEN;

  if (!authToken) {
    throw new Error('AUTH_TOKEN / chartedSeaApiToken belum di-set.');
  }

  const formattedSearchQuery = formatSearchQuery(searchQuery);
  const searchUrl = `https://www.lazada.co.id/catalog/?q=${formattedSearchQuery}`;

  const body = {
    requests: [{ url: searchUrl }],
    language: 'id',
    emulateMobileDevice: true,
    cleanResponseBody: true,
  };

  const response = await axios.post(CHARTED_SEA_LAZADA_URL, body, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    params: { autoCancelAfterSec: 120 },
  });

  // Response selalu array (1 elemen per request yang dikirim di "requests")
  const tasks = Array.isArray(response.data) ? response.data : [response.data];
  const task = tasks[0];

  if (!task || task.status !== 'SUCCESS') {
    throw new Error(
      `Lazada scraping task gagal (status: ${task?.status || 'UNKNOWN'}): ${task?.errorMessage || 'tanpa pesan error'}`
    );
  }

  const responseBody =
    typeof task.responseBody === 'string'
      ? JSON.parse(task.responseBody)
      : task.responseBody;

  const products = responseBody?.products || [];

  const top10Products = products.slice(0, limit).map(product => ({
    title: product.name,
    pricing: {
      original: product.originalPrice ?? product.price,
    },
    sold_count: product.soldCount,
    reviews: {
      average_rating: product.ratingScore ?? 0,
    },
    thumbnail_url: product.imageUrl,
    product_url: product.pageUrl,
  }));

  return top10Products;
}

module.exports = { searchProducts };