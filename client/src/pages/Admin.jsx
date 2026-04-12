import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Admin() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [tab, setTab] = useState('comments');
  const [responses, setResponses] = useState({});

  useEffect(() => {
    if (user && user.role !== 'admin') { navigate('/feed'); return; }
    loadAll();
  }, [user]);

  function loadAll() {
    authFetch('/api/comments/all').then(r => r.json()).then(d => setComments(Array.isArray(d) ? d : []));
    authFetch('/api/appeals').then(r => r.json()).then(d => setAppeals(Array.isArray(d) ? d : []));
  }

  async function deleteComment(id) {
    if (!confirm('Remove this comment?')) return;
    await authFetch(`/api/comments/${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function respondAppeal(id, action) {
    const text = responses[id];
    if (!text?.trim()) { alert('Please write a response first.'); return; }
    const res = await authFetch(`/api/appeals/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_response: text, action })
    });
    if (res.ok) { setResponses(r => ({ ...r, [id]: '' })); loadAll(); }
  }

  const activeComments = comments.filter(c => !c.deleted);
  const deletedComments = comments.filter(c => c.deleted);
  const pendingAppeals = appeals.filter(a => a.status === 'pending');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '22px' }}>🛡</span>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Admin Dashboard</h1>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '28px' }}>Academic Integrity Enforcement</p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Active Comments', value: activeComments.length, color: 'var(--text)' },
          { label: 'Removed Comments', value: deletedComments.length, color: 'var(--danger)' },
          { label: 'Pending Appeals', value: pendingAppeals.length, color: 'var(--yellow)' }
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'comments', label: `All Comments (${comments.length})` },
          { key: 'appeals', label: `Appeals (${pendingAppeals.length} pending)` }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="btn btn-ghost btn-sm"
            style={{
              background: tab === t.key ? 'var(--yellow)' : 'transparent',
              color: tab === t.key ? '#000' : 'var(--text2)',
              border: tab === t.key ? 'none' : '1px solid var(--border)'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)' }}>No comments yet.</p>
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} className="card" style={{ borderColor: c.deleted ? 'var(--danger)' : 'var(--border)', opacity: c.deleted ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '14px' }}>{c.reviewer_name}</p>
                  <p style={{ color: 'var(--text2)', fontSize: '12px' }}>on "{c.assignment_title}" · {timeAgo(c.created_at)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {c.deleted
                    ? <span className="badge badge-red">Removed</span>
                    : <button className="btn btn-danger btn-sm" onClick={() => deleteComment(c.id)}>Remove</button>
                  }
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.5' }}>{c.body}</p>
              {c.source_link && (
                <a href={c.source_link} target="_blank" rel="noreferrer"
                  style={{ fontSize: '13px', color: 'var(--yellow)', display: 'block', marginTop: '6px' }}>
                  🔗 {c.source_link}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'appeals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {appeals.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)' }}>No appeals to review.</p>
            </div>
          )}
          {appeals.map(ap => (
            <div key={ap.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>Appeal from {ap.appellant_name}</p>
                  <p style={{ color: 'var(--text2)', fontSize: '12px' }}>
                    for "{ap.assignment_title}" · {timeAgo(ap.created_at)}
                  </p>
                </div>
                <span className={`badge ${ap.status === 'pending' ? 'badge-yellow' : ap.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                  {ap.status}
                </span>
              </div>

              <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Removed comment:</p>
                <p style={{ fontSize: '13px' }}>{ap.comment_body}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Student's appeal:</p>
                <p style={{ fontSize: '14px' }}>{ap.appeal_text}</p>
              </div>

              {ap.status === 'pending' && (
                <div>
                  <textarea
                    placeholder="Write your response to the student..."
                    rows={3}
                    value={responses[ap.id] || ''}
                    onChange={e => setResponses(r => ({ ...r, [ap.id]: e.target.value }))}
                    style={{ marginBottom: '10px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => respondAppeal(ap.id, 'approved')}>
                      ✓ Approve (restore comment)
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => respondAppeal(ap.id, 'rejected')}>
                      ✗ Reject appeal
                    </button>
                  </div>
                </div>
              )}

              {ap.admin_response && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Your response:</p>
                  <p style={{ fontSize: '13px' }}>{ap.admin_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
