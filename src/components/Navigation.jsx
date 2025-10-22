import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiX, FiHome, FiLogOut, FiUser } from 'react-icons/fi';

const Navigation = () => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/dashboard')}>
          <h1>Allery</h1>
        </div>

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <div className="nav-user">
            <FiUser />
            <div className="nav-user-info">
              <span className="nav-user-name">{userProfile?.name}</span>
              <span className="nav-user-role">{userProfile?.role}</span>
            </div>
          </div>

          <button
            className="nav-item"
            onClick={() => {
              navigate('/dashboard');
              setMenuOpen(false);
            }}
          >
            <FiHome />
            <span>Dashboard</span>
          </button>

          <button className="nav-item" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
