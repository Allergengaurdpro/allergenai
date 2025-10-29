import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiActivity,
  FiAlertTriangle,
  FiClock,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiCamera,
  FiHeart,
  FiBookOpen
} from 'react-icons/fi';

const Sidebar = () => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation items for different roles
  const receiverNavItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiCamera, label: 'Start Scanning', path: '/scan' },
    { icon: FiClock, label: 'Scanning History', path: '/history' },
    { icon: FiHeart, label: 'My Allergens', path: '/my-allergens' },
    { icon: FiBookOpen, label: 'Allergen Guide', path: '/allergen-guide' },
  ];

  const managerNavItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiUsers, label: 'User Management', path: '/users' },
    { icon: FiPackage, label: 'Vendor Management', path: '/vendors' },
    { icon: FiActivity, label: 'Scanning Activity', path: '/activity' },
    { icon: FiAlertTriangle, label: 'Allergen Inventory', path: '/allergen-inventory' },
    { icon: FiBarChart2, label: 'Reports', path: '/reports' },
  ];

  const navItems = userProfile?.role === 'manager' ? managerNavItems : receiverNavItems;

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button className="mobile-menu-btn" onClick={handleToggle}>
          <FiMenu />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${isMobile && !mobileOpen ? 'sidebar-mobile-hidden' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {!collapsed && (
              <>
                <div className="brand-icon">🛡️</div>
                <div className="brand-text">
                  <h2>AllergyGuard</h2>
                  <span>Pro</span>
                </div>
              </>
            )}
            {collapsed && <div className="brand-icon-collapsed">🛡️</div>}
          </div>
          {!isMobile && (
            <button
              className="sidebar-toggle"
              onClick={handleToggle}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FiMenu /> : <FiX />}
            </button>
          )}
          {isMobile && (
            <button
              className="sidebar-toggle"
              onClick={handleToggle}
              title="Close menu"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* User Profile Section */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {userProfile?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{userProfile?.name}</div>
              <div className="user-role">{userProfile?.role}</div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!collapsed && <div className="nav-section-title">Main Menu</div>}
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={collapsed ? item.label : ''}
              >
                <item.icon className="nav-item-icon" />
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
                {isActive(item.path) && <div className="nav-item-indicator"></div>}
              </button>
            ))}
          </div>

          {/* Settings & Logout */}
          <div className="nav-section nav-section-bottom">
            {!collapsed && <div className="nav-section-divider"></div>}
            <button
              className="nav-item"
              onClick={() => navigate('/settings')}
              title={collapsed ? 'Settings' : ''}
            >
              <FiSettings className="nav-item-icon" />
              {!collapsed && <span className="nav-item-label">Settings</span>}
            </button>
            <button
              className="nav-item nav-item-logout"
              onClick={handleLogout}
              title={collapsed ? 'Logout' : ''}
            >
              <FiLogOut className="nav-item-icon" />
              {!collapsed && <span className="nav-item-label">Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
