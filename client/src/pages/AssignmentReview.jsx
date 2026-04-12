import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function AssignmentReview() {
  const { id } = useParams();
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appealText, setAppealText] = useState({});
  const [appealOpen, setAppealOpen] = useState({});

  function load() {
    authFetch(`/api/assignments/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }

  useEffect(() => { load(); }, [id]);

  async function submitComment(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await authFetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: parseInt(id), body: comment, source_link: sourceLink })
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error); setSubmitting(false); return; }
    setComment(''); setSourceLink('');
    setSubmitting(false);
    load();
  }

  async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;
    await authFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    load();
  }

  async function submitAppeal(commentId) {
    const text = appealText[commentId];
    if (!text?.trim()) return;
    const res = await authFetch('/api/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, appeal_text: text })
    });
    const result = await res.json();
    if (res.ok) {
      setAppealOpen(a => ({ ...a, [commentId]: false }));
      alert('Appeal submitted successfully.');
    } else {
      alert(result.error);
    }
  }

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)' }}>Loading...</div>;
  if (!data || data.error) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)' }}>Assignment not found.</div>;

  const isOwner = data.user_id === user?.id;
  const isAdmin = user?.role === 'admin';
  const reviewClosed = data.review_deadline && new Date(data.review_deadline) < new Date();

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/feed')} style={{ marginBottom: '20px' }}>← Back to Feed</button>

      {/* Assignment header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span className="badge badge-gray">{data.course_name}</span>
          {reviewClosed && <span className="badge badge-red">Review closed</span>}
          {!reviewClosed && data.review_deadline && <span className="badge badge-green">Review open</span>}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{data.title}</h1>
        {data.description && <p style={{ color: 'var(--text2)', lineHeight: '1.6', marginBottom: '12px' }}>{data.description}</p>}
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
          Posted by <strong style={{ color: 'var(--text)' }}>{data.author_name}</strong> · {timeAgo(data.created_at)}
        </p>
        {data.review_deadline && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            Review deadline: <strong style={{ color: 'var(--text)' }}>{new Date(data.review_deadline).toLocaleString()}</strong>
          </p>
        )}
        {data.submission_deadline && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            Submission deadline: <strong style={{ color: 'var(--text)' }}>{new Date(data.submission_deadline).toLocaleString()}</strong>
          </p>
        )}
        {data.file_path && (
          <a href={data.file_path} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '14px', color: 'var(--yellow)', fontSize: '14px' }}>
            📄 View attached file
          </a>
        )}
      </div>

      {/* Comments section */}
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>
        {data.comments?.filter(c => !c.deleted).length || 0} Reviews
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {data.comments?.length === 0 && (
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>No reviews yet. Be the first!</p>
        )}
        {data.comments?.map(c => (
          <div key={c.id} className="card" style={{
            opacity: c.deleted ? 0.5 : 1,
            borderColor: c.deleted ? 'var(--danger)' : 'var(--border)'
          }}>
            {c.deleted ? (
              <div>
                <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '6px' }}>🚫 This comment was removed by an admin.</p>
                {(c.reviewer_id === user?.id || isOwner) && !appealOpen[c.id] && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setAppealOpen(a => ({ ...a, [c.id]: true }))}>
                    Appeal removal
                  </button>
                )}
                {appealOpen[c.id] && (
                  <div style={{ marginTop: '10px' }}>
                    <textarea
                      placeholder="Explain why this comment should be restored..."
                      rows={3}
                      value={appealText[c.id] || ''}
                      onChange={e => setAppealText(a => ({ ...a, [c.id]: e.target.value }))}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => submitAppeal(c.id)}>Submit Appeal</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAppealOpen(a => ({ ...a, [c.id]: false }))}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontWeight: 500, fontSize: '14px' }}>{c.reviewer_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{timeAgo(c.created_at)}</span>
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => deleteComment(c.id)}>Remove</button>
                    )}
                  </div>
                </div>
                <p style={{ color: 'var(--text2)', marginTop: '6px', lineHeight: '1.6', fontSize: '14px' }}>{c.body}</p>
                {c.source_link && (
                  <a href={c.source_link} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: '8px', color: 'var(--yellow)', fontSize: '13px' }}>
                    🔗 {c.source_link}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leave a comment */}
      {!isOwner && !reviewClosed && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>Leave a Review</h3>
          <form onSubmit={submitComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              placeholder="Write your feedback... Be specific and constructive."
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
            <input
              placeholder="Source link (optional)"
              value={sourceLink}
              onChange={e => setSourceLink(e.target.value)}
            />
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>
        </div>
      )}

      {isOwner && (
        <div className="card" style={{ background: 'rgba(245,197,24,0.05)', borderColor: 'rgba(245,197,24,0.2)' }}>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            💡 This is your assignment. Read the reviews above and incorporate feedback before your submission deadline.
          </p>
        </div>
      )}

      {!isOwner && reviewClosed && (
        <div className="card">
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>The review window for this assignment has closed.</p>
        </div>
      )}
    </div>
  );
}
