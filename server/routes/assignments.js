const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/assignments - get all assignments (feed)
router.get('/', authMiddleware, (req, res) => {
  const { course } = req.query;
  let query = `
    SELECT a.*, u.name as author_name, u.course as author_course,
    (SELECT COUNT(*) FROM comments c WHERE c.assignment_id = a.id AND c.deleted = 0) as comment_count
    FROM assignments a JOIN users u ON a.user_id = u.id
  `;
  const params = [];
  if (course) { query += ' WHERE a.course_name = ?'; params.push(course); }
  query += ' ORDER BY a.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/assignments/mine - current user's assignments
router.get('/mine', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, (SELECT COUNT(*) FROM comments c WHERE c.assignment_id = a.id AND c.deleted = 0) as comment_count
    FROM assignments a WHERE a.user_id = ? ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json(rows);
});

// GET /api/assignments/:id - single assignment with comments
router.get('/:id', authMiddleware, (req, res) => {
  const assignment = db.prepare(`
    SELECT a.*, u.name as author_name FROM assignments a
    JOIN users u ON a.user_id = u.id WHERE a.id = ?
  `).get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const comments = db.prepare(`
    SELECT c.*, u.name as reviewer_name FROM comments c
    JOIN users u ON c.reviewer_id = u.id
    WHERE c.assignment_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ ...assignment, comments });
});

// POST /api/assignments - create assignment
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  const { title, description, course_name, review_deadline, submission_deadline } = req.body;
  if (!title || !course_name) return res.status(400).json({ error: 'Title and course are required' });

  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(`
    INSERT INTO assignments (user_id, title, description, course_name, file_path, review_deadline, submission_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, description || null, course_name, file_path, review_deadline || null, submission_deadline || null);

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(assignment);
});

// DELETE /api/assignments/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Not found' });
  if (assignment.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;