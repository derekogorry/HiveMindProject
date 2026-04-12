const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST /api/appeals - student submits appeal
router.post('/', authMiddleware, (req, res) => {
  const { comment_id, appeal_text } = req.body;
  if (!comment_id || !appeal_text) return res.status(400).json({ error: 'comment_id and appeal_text required' });

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(comment_id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (!comment.deleted) return res.status(400).json({ error: 'Can only appeal deleted comments' });

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(comment.assignment_id);
  if (assignment.user_id !== req.user.id && comment.reviewer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to appeal this comment' });
  }

  const existing = db.prepare('SELECT * FROM appeals WHERE comment_id = ? AND user_id = ?').get(comment_id, req.user.id);
  if (existing) return res.status(400).json({ error: 'You already appealed this comment' });

  const result = db.prepare(
    'INSERT INTO appeals (user_id, comment_id, appeal_text) VALUES (?, ?, ?)'
  ).run(req.user.id, comment_id, appeal_text);

  res.status(201).json({ id: result.lastInsertRowid, status: 'pending' });
});

// GET /api/appeals/mine - student's own appeals
router.get('/mine', authMiddleware, (req, res) => {
  const appeals = db.prepare(`
    SELECT ap.*, c.body as comment_body, a.title as assignment_title
    FROM appeals ap
    JOIN comments c ON ap.comment_id = c.id
    JOIN assignments a ON c.assignment_id = a.id
    WHERE ap.user_id = ?
    ORDER BY ap.created_at DESC
  `).all(req.user.id);
  res.json(appeals);
});

// GET /api/appeals - admin gets all appeals
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  const appeals = db.prepare(`
    SELECT ap.*, u.name as appellant_name, c.body as comment_body, a.title as assignment_title
    FROM appeals ap
    JOIN users u ON ap.user_id = u.id
    JOIN comments c ON ap.comment_id = c.id
    JOIN assignments a ON c.assignment_id = a.id
    WHERE ap.expires_at > CURRENT_TIMESTAMP
    ORDER BY ap.created_at DESC
  `).all();
  res.json(appeals);
});

// PUT /api/appeals/:id/respond - admin responds
router.put('/:id/respond', authMiddleware, adminMiddleware, (req, res) => {
  const { admin_response, action } = req.body;
  if (!admin_response) return res.status(400).json({ error: 'admin_response required' });

  const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(req.params.id);
  if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

  const status = action === 'approved' ? 'approved' : 'rejected';
  db.prepare('UPDATE appeals SET admin_response = ?, status = ? WHERE id = ?').run(admin_response, status, req.params.id);

  if (status === 'approved') {
    db.prepare('UPDATE comments SET deleted = 0, deleted_by = NULL WHERE id = ?').run(appeal.comment_id);
  }

  res.json({ message: `Appeal ${status}` });
});

module.exports = router;
