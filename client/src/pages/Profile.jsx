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

export default function Profile() {
  const { user, authFetch } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [tab, setTab] = useState('assignments');

  useEffect(() => {
    authFetch('/api/assignments/mine').then(r => r.json()).then(d => setAssignments(Array.isArray(d) ? d : []));
    authFetch('/api/appeals/mine').then(r => r.json()).then(d => setAppeals(Array.isArray(d) ? d : []));
  }, []);

  const statusColor = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Profile header */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 700, color: '#000', flexShrink: 0
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{user?.name}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{user?.email}</p>
          {user?.course && <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '2px' }}>📚 {user.course}</p>}
          <span className={`badge ${user?.role === 'admin' ? 'badge-yellow' : 'badge-gray'}`} style={{ marginTop: '8px', display: 'inline-block' }}>
            {user?.role === 'admin' ? '🛡 Admin' : '🎓 Student'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['assignments', 'appeals'].map(t => (
          <button key={t} onClick={() => setTab(t)} className="btn btn-ghost btn-sm"
            style={{
              background: tab === t ? 'var(--yellow)' : 'transparent',
              color: tab === t ? '#000' : 'var(--text2)',
              border: tab === t ? 'none' : '1px solid var(--border)'
            }}>
            {t === 'assignments' ? `My Assignments (${assignments.length})` : `My Appeals (${appeals.length})`}
          </button>
        ))}
      </div>

      {tab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assignments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)', marginBottom: '14px' }}>You haven't posted any assignments yet.</p>
              <Link to="/upload"><button className="btn btn-primary">Post Your First Assignment</button></Link>
            </div>
          )}
          {assignments.map(a => (
            <Link to={`/assignment/${a.id}`} key={a.id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--yellow)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge badge-gray" style={{ marginBottom: '6px', display: 'inline-block' }}>{a.course_name}</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{a.title}</h3>
                    <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>{timeAgo(a.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700 }}>{a.comment_count}</p>
                    <p style={{ color: 'var(--text2)', fontSize: '12px' }}>reviews</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'appeals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {appeals.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)' }}>No appeals submitted.</p>
            </div>
          )}
          {appeals.map(ap => (
            <div key={ap.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{ap.assignment_title}</p>
                <span className={`badge ${statusColor[ap.status] || 'badge-gray'}`}>{ap.status}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                Removed comment: "{ap.comment_body?.slice(0, 80)}..."
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                Your appeal: <span style={{ color: 'var(--text)' }}>{ap.appeal_text}</span>
              </p>
              {ap.admin_response && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Admin response:</p>
                  <p style={{ fontSize: '13px' }}>{ap.admin_response}</p>
                </div>
              )}
              <p style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '10px' }}>
                Submitted {timeAgo(ap.created_at)} · Expires {new Date(ap.expires_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
