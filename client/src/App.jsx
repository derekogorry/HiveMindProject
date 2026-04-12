import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Upload from './pages/Upload';
import AssignmentReview from './pages/AssignmentReview';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Admin from './pages/Admin';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)' }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/feed" /> : <Login />} />
      <Route path="/feed" element={<PrivateRoute><Layout><Feed /></Layout></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><Layout><Upload /></Layout></PrivateRoute>} />
      <Route path="/assignment/:id" element={<PrivateRoute><Layout><AssignmentReview /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/friends" element={<PrivateRoute><Layout><Friends /></Layout></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><Layout><Admin /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? '/feed' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
