const queueRepository = require('../repositories/queueRepository');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

async function addToQueue({ ticket_id: ticketId, products }) {
  if (!ticketId || !Array.isArray(products)) {
    throw new ValidationError('ticket_id dan products (array) wajib diisi');
  }
  return queueRepository.upsertTicket(ticketId, products);
}

async function removeFromQueue({ ticket_id: ticketId }) {
  if (!ticketId) {
    throw new ValidationError('ticket_id wajib diisi');
  }
  return queueRepository.removeTicket(ticketId);
}

async function getQueue() {
  return queueRepository.findAll();
}

module.exports = { addToQueue, removeFromQueue, getQueue, ValidationError };
