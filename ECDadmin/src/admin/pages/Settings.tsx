import React from 'react';
import './Settings.css';

const Settings: React.FC = () => {
  return (
    <div className="settings">
      <h1>Settings</h1>
      <div className="settings-content">
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="setting-item">
            <label>Site Name</label>
            <input type="text" defaultValue="RBAC Admin Dashboard" />
          </div>
          <div className="setting-item">
            <label>Admin Email</label>
            <input type="email" defaultValue="admin@example.com" />
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Security Settings</h3>
          <div className="setting-item">
            <label>Session Timeout (minutes)</label>
            <input type="number" defaultValue="30" />
          </div>
          <div className="setting-item">
            <label>Enable Two-Factor Authentication</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Notification Settings</h3>
          <div className="setting-item">
            <label>Email Notifications</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>SMS Notifications</label>
            <input type="checkbox" />
          </div>
        </div>
        
        <button className="save-button">Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;
