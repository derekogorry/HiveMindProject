const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST /api/comments - leave a comment
router.post('/', authMiddleware, (req, res) => {
  const { assignment_id, body, source_link } = req.body;
  if (!assignment_id || !body) return res.status(400).json({ error: 'assignment_id and body required' });

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignment_id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  if (assignment.user_id === req.user.id) return res.status(400).json({ error: 'Cannot comment on your own assignment' });

  const result = db.prepare(
    'INSERT INTO comments (assignment_id, reviewer_id, body, source_link) VALUES (?, ?, ?, ?)'
  ).run(assignment_id, req.user.id, body, source_link || null);

  const comment = db.prepare(`
    SELECT c.*, u.name as reviewer_name FROM comments c
    JOIN users u ON c.reviewer_id = u.id WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

// DELETE /api/comments/:id - admin soft delete
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  db.prepare('UPDATE comments SET deleted = 1, deleted_by = ? WHERE id = ?').run(req.user.id, req.params.id);
  res.json({ message: 'Comment removed' });
});

// GET /api/comments/all - admin view all comments including deleted
router.get('/all', authMiddleware, adminMiddleware, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as reviewer_name, a.title as assignment_title
    FROM comments c
    JOIN users u ON c.reviewer_id = u.id
    JOIN assignments a ON c.assignment_id = a.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(comments);
});

module.exports = router;
