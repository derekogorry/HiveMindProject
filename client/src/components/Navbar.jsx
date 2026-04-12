import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={{
      background: '#111',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '22px' }}>🐝</span>
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--yellow)' }}>HiveMind</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link to="/feed">
          <button className="btn btn-ghost btn-sm">Feed</button>
        </Link>
        <Link to="/upload">
          <button className="btn btn-ghost btn-sm">+ Post</button>
        </Link>
        <Link to="/friends">
          <button className="btn btn-ghost btn-sm">Friends</button>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin">
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--yellow)' }}>Admin</button>
          </Link>
        )}
        <Link to="/profile">
          <button className="btn btn-ghost btn-sm">
            {user?.name?.split(' ')[0] || 'Profile'}
          </button>
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
