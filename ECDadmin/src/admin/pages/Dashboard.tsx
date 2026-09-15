import React, { useState } from 'react';
import DashboardTemplate from '../dashboard/Dashboard';
import AdminLayout from '../layouts/AdminLayout';

const Dashboard: React.FC = () => {
  const [useNewDashboard, setUseNewDashboard] = useState(true); // Changed to true by default

  if (useNewDashboard) {
    return (
      <DashboardTemplate
        onToggleDashboard={() => setUseNewDashboard(false)}
        showToggleButton={true}
      />
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setUseNewDashboard(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔄 Switch to New Material-UI Dashboard
          </button>
        </div>
        
        <h1>🎯 Admin Dashboard</h1>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>👥 Total Users</h3>
            <p className="stat-number">2</p>
            <p className="stat-description">Active users in system</p>
          </div>
          
          <div className="stat-card">
            <h3>👑 Admin Users</h3>
            <p className="stat-number">1</p>
            <p className="stat-description">Administrators</p>
          </div>
          
          <div className="stat-card">
            <h3>👤 Regular Users</h3>
            <p className="stat-number">1</p>
            <p className="stat-description">Standard users</p>
          </div>
        </div>

        <div className="recent-activity">
          <h2>🚀 Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">Just now</span>
              <span className="activity-text">Admin user logged in successfully</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">2 minutes ago</span>
              <span className="activity-text">System initialized and ready</span>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary">👥 Manage Users</button>
            <button className="action-btn secondary">📊 View Reports</button>
            <button className="action-btn secondary">⚙️ System Settings</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;