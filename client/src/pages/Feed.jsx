import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

function deadlineStatus(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - Date.now();
  const h = Math.floor(diff / 3600000);
  if (diff < 0) return { label: 'Closed', cls: 'badge-red' };
  if (h < 24) return { label: `${h}h left`, cls: 'badge-yellow' };
  return { label: `${Math.floor(h / 24)}d left`, cls: 'badge-green' };
}

export default function Feed() {
  const { authFetch, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/api/assignments')
      .then(r => r.json())
      .then(data => { setAssignments(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.course_name.toLowerCase().includes(search.toLowerCase()) ||
    a.author_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Assignment Feed</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>Review your peers' work</p>
        </div>
        <Link to="/upload">
          <button className="btn btn-primary">+ Post Assignment</button>
        </Link>
      </div>

      <input
        placeholder="Search by title, course, or author..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '20px' }}
      />

      {loading && <p style={{ color: 'var(--text2)' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📭</p>
          <p style={{ color: 'var(--text2)' }}>No assignments yet. Be the first to post!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.map(a => {
          const rd = deadlineStatus(a.review_deadline);
          const isOwn = a.user_id === user?.id;
          return (
            <Link to={`/assignment/${a.id}`} key={a.id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--yellow)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-gray">{a.course_name}</span>
                      {rd && <span className={`badge ${rd.cls}`}>{rd.label}</span>}
                      {isOwn && <span className="badge badge-yellow">Your post</span>}
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{a.title}</h3>
                    {a.description && (
                      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px', lineHeight: '1.5' }}>
                        {a.description.length > 120 ? a.description.slice(0, 120) + '...' : a.description}
                      </p>
                    )}
                    <p style={{ color: 'var(--text2)', fontSize: '13px' }}>
                      by <strong style={{ color: 'var(--text)' }}>{a.author_name}</strong> · {timeAgo(a.created_at)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '16px', flexShrink: 0 }}>
                    <p style={{ fontSize: '20px', fontWeight: 700 }}>{a.comment_count}</p>
                    <p style={{ color: 'var(--text2)', fontSize: '12px' }}>reviews</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
