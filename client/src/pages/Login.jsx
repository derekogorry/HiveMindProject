import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', course: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, course: form.course, role: form.role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      login(data.token, data.user);
      navigate('/feed');
    } catch {
      setError('Network error. Is the server running?');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐝</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--yellow)' }}>HiveMind</h1>
          <p style={{ color: 'var(--text2)', marginTop: '6px', fontSize: '14px' }}>Peer review for better submissions</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: mode === m ? 'var(--yellow)' : 'var(--bg3)',
                  color: mode === m ? '#000' : 'var(--text2)',
                  fontWeight: 500, fontSize: '14px', transition: 'all 0.15s'
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'register' && (
              <input name="name" placeholder="Full name" value={form.name} onChange={update} required />
            )}
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} required />
            {mode === 'register' && (
              <>
                <input name="course" placeholder="Your major / course (e.g. CSC 4370)" value={form.course} onChange={update} />
                <select name="role" value={form.role} onChange={update}>
                  <option value="student">Student</option>
                  <option value="admin">Admin (Academic Integrity)</option>
                </select>
              </>
            )}
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
