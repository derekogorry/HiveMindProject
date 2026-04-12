const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/friends - get my friends and requests
router.get('/', authMiddleware, (req, res) => {
  const friends = db.prepare(`
    SELECT f.*, 
      CASE WHEN f.sender_id = ? THEN u2.name ELSE u1.name END as other_name,
      CASE WHEN f.sender_id = ? THEN f.receiver_id ELSE f.sender_id END as other_id,
      CASE WHEN f.sender_id = ? THEN u2.course ELSE u1.course END as other_course
    FROM friends f
    JOIN users u1 ON f.sender_id = u1.id
    JOIN users u2 ON f.receiver_id = u2.id
    WHERE (f.sender_id = ? OR f.receiver_id = ?)
    ORDER BY f.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json(friends);
});

// POST /api/friends/request - send friend request
router.post('/request', authMiddleware, (req, res) => {
  const { receiver_id } = req.body;
  if (!receiver_id) return res.status(400).json({ error: 'receiver_id required' });
  if (receiver_id === req.user.id) return res.status(400).json({ error: 'Cannot friend yourself' });

  const existing = db.prepare(
    'SELECT * FROM friends WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)'
  ).get(req.user.id, receiver_id, receiver_id, req.user.id);

  if (existing) return res.status(400).json({ error: 'Request already exists' });

  const result = db.prepare('INSERT INTO friends (sender_id, receiver_id) VALUES (?, ?)').run(req.user.id, receiver_id);
  res.status(201).json({ id: result.lastInsertRowid, status: 'pending' });
});

// PUT /api/friends/:id/respond - accept or decline
router.put('/:id/respond', authMiddleware, (req, res) => {
  const { action } = req.body;
  if (!['accepted', 'declined'].includes(action)) return res.status(400).json({ error: 'action must be accepted or declined' });

  const request = db.prepare('SELECT * FROM friends WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.receiver_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  db.prepare('UPDATE friends SET status = ? WHERE id = ?').run(action, req.params.id);
  res.json({ message: `Request ${action}` });
});

// GET /api/friends/users - search users to add
router.get('/users', authMiddleware, (req, res) => {
  const { q } = req.query;
  let query = 'SELECT id, name, email, course FROM users WHERE id != ?';
  const params = [req.user.id];
  if (q) { query += ' AND (name LIKE ? OR course LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  query += ' LIMIT 20';
  res.json(db.prepare(query).all(...params));
});

module.exports = router;
