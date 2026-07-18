const path = require('path');
const JsonFileStore = require('../utils/jsonFileStore');

const QUEUE_PATH = path.join(__dirname, '../../..', 'queue.json');
const store = new JsonFileStore(QUEUE_PATH, []);

async function findAll() {
  return store.readAll();
}

async function upsertTicket(ticketId, products) {
  const queue = await store.readAll();
  const existingIndex = queue.findIndex((item) => item.ticket_id === ticketId);

  if (existingIndex !== -1) {
    queue[existingIndex].products = products;
  } else {
    const newId = queue.length > 0 ? Math.max(...queue.map((item) => item.id)) + 1 : 1;
    queue.push({ id: newId, ticket_id: ticketId, products });
  }

  await store.writeAll(queue);
  return queue;
}

async function removeTicket(ticketId) {
  const queue = await store.readAll();
  const filtered = queue.filter((item) => item.ticket_id !== ticketId);
  await store.writeAll(filtered);
  return filtered;
}

module.exports = { findAll, upsertTicket, removeTicket };
