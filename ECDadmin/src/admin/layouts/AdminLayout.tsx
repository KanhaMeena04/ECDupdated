import React from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/auth';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  
  const user = authAPI.getCurrentUser();

  const handleLogout = async () => {
    await authAPI.logout();
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <span>📊</span> Dashboard
          </Link>
          <Link to="/users" className="nav-item">
            <span>👥</span> Users
          </Link>
          <Link to="/settings" className="nav-item">
            <span>⚙️</span> Settings
          </Link>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>
      
      <div className="main-content">
        <header className="top-bar">
          <h3>Welcome, {user?.name}</h3>
          <span className="user-role">Admin</span>
        </header>
        
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;