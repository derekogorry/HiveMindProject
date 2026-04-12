import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Friends() {
  const { authFetch } = useAuth();
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('friends');

  function loadFriends() {
    authFetch('/api/friends').then(r => r.json()).then(d => setFriends(Array.isArray(d) ? d : []));
  }

  useEffect(() => { loadFriends(); }, []);

  async function search(q) {
    setQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const res = await authFetch(`/api/friends/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(Array.isArray(data) ? data : []);
  }

  async function sendRequest(receiver_id) {
    const res = await authFetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id })
    });
    if (res.ok) { alert('Friend request sent!'); loadFriends(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function respond(id, action) {
    await authFetch(`/api/friends/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    loadFriends();
  }

  const accepted = friends.filter(f => f.status === 'accepted');
  const incoming = friends.filter(f => f.status === 'pending' && f.sender_id !== undefined);
  const outgoing = friends.filter(f => f.status === 'pending' && f.sender_id === undefined);
  const pending = friends.filter(f => f.status === 'pending');

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Friends</h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>Connect with peers in your field</p>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Find Students</h2>
        <input
          placeholder="Search by name or course..."
          value={query}
          onChange={e => search(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searchResults.map(u => {
              const alreadyFriend = friends.some(f => f.other_id === u.id);
              return (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '14px' }}>{u.name}</p>
                    {u.course && <p style={{ color: 'var(--text2)', fontSize: '13px' }}>{u.course}</p>}
                  </div>
                  {alreadyFriend
                    ? <span className="badge badge-gray">Already connected</span>
                    : <button className="btn btn-primary btn-sm" onClick={() => sendRequest(u.id)}>+ Add</button>
                  }
                </div>
              );
            })}
          </div>
        )}
        {query && searchResults.length === 0 && (
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '10px' }}>No students found.</p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'friends', label: `Friends (${accepted.length})` },
          { key: 'pending', label: `Pending (${pending.length})` }
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

      {tab === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {accepted.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)' }}>No friends yet. Search above to connect!</p>
            </div>
          )}
          {accepted.map(f => (
            <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: '16px', color: 'var(--yellow)', flexShrink: 0
              }}>
                {f.other_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 500 }}>{f.other_name}</p>
                {f.other_course && <p style={{ color: 'var(--text2)', fontSize: '13px' }}>{f.other_course}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pending.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)' }}>No pending requests.</p>
            </div>
          )}
          {pending.map(f => (
            <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: '16px', color: 'var(--yellow)'
                }}>
                  {f.other_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>{f.other_name}</p>
                  {f.other_course && <p style={{ color: 'var(--text2)', fontSize: '13px' }}>{f.other_course}</p>}
                  <span className="badge badge-yellow" style={{ marginTop: '4px', display: 'inline-block', fontSize: '11px' }}>pending</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => respond(f.id, 'accepted')}>Accept</button>
                <button className="btn btn-ghost btn-sm" onClick={() => respond(f.id, 'declined')}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
