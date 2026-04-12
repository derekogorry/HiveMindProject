import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Upload() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', course_name: '',
    review_deadline: '', submission_deadline: ''
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    if (file) fd.append('file', file);

    try {
      const res = await authFetch('/api/assignments', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      navigate(`/assignment/${data.id}`);
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Post an Assignment</h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '28px' }}>
        Share your work with peers for review before submission
      </p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Assignment Title *</label>
          <input name="title" placeholder="e.g. Final Project Proposal" value={form.title} onChange={update} required />
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Course *</label>
          <input name="course_name" placeholder="e.g. CSC 4370" value={form.course_name} onChange={update} required />
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Description</label>
          <textarea name="description" placeholder="What is this assignment about? What kind of feedback are you looking for?" value={form.description} onChange={update} rows={4} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Review Deadline</label>
            <input type="datetime-local" name="review_deadline" value={form.review_deadline} onChange={update} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Submission Deadline</label>
            <input type="datetime-local" name="submission_deadline" value={form.submission_deadline} onChange={update} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Upload File (PDF, max 10MB)</label>
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '24px',
            textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s'
          }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--yellow)'; }}
            onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor = 'var(--border)'; }}
            onClick={() => document.getElementById('file-input').click()}
          >
            {file
              ? <p style={{ color: 'var(--yellow)' }}>📄 {file.name}</p>
              : <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Drop a file here or click to browse</p>
            }
          </div>
          <input id="file-input" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/feed')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? 'Posting...' : 'Post for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
