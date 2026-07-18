const axios = require('axios');
const env = require('../config/env');
const apiKeyRepository = require('../repositories/apiKeyRepository');
const logger = require('../utils/logger');

function isCreditExhaustedError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message || '';
  return status === 402 || status === 429 || /credit/i.test(message);
}

/**
 * Cari produk ke Lazada, kalau satu API key habis kredit, otomatis coba
 * key berikutnya yang masih tersedia (round-robin sederhana lewat urutan
 * array di apikeys.json).
 */
async function searchProductsWithRetry(params) {
  const availableKeys = await apiKeyRepository.findAvailable();

  if (availableKeys.length === 0) {
    throw new Error('Semua API key sudah habis kreditnya.');
  }

  let lastError = null;

  for (const keyObj of availableKeys) {
    try {
      const response = await axios.get(env.lazadaSearchUrl, {
        params,
        headers: { 'API-Key': keyObj.apiKey },
      });

      // Request berhasil -> key ini benar-benar terpakai, kurangi sisa kreditnya.
      await apiKeyRepository.decrementCredit(keyObj.apiKey, 1);

      return response.data;
    } catch (error) {
      lastError = error;

      if (isCreditExhaustedError(error)) {
        logger.warn(`API key habis kredit, tandai exhausted dan coba key berikutnya`);
        await apiKeyRepository.markAsExhausted(keyObj.apiKey);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Semua API key gagal digunakan.');
}

async function searchProducts({ search_query: searchQuery, marketplace = 'id', limit = 10 }) {
  const data = await searchProductsWithRetry({
    search_query: searchQuery,
    marketplace,
  });
  return data.products?.slice(0, limit) || [];
}

module.exports = { searchProducts, searchProductsWithRetry };