import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ adminLoggedIn, onLogout, userProfile }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to NameVerse!', read: false },
    { id: 2, text: 'New features Coming Soon', read: false }
  ]);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active link
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  const toggleNavbar = () => setIsCollapsed(!isCollapsed);
  
  const handleLinkClick = () => {
    setIsCollapsed(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isActive = (path) => activeLink === path;

  return (
    <>
      <style>
        {`
          /* Main Navbar Styles */
          .navbar-custom {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 15px 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .navbar-scrolled {
            padding: 10px 0;
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
          }
          
          /* Brand Styling */
          .brand-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .brand-icon {
            font-size: 28px;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: pulse 2s infinite;
          }
          
          .brand-title {
            font-weight: 700;
            color: white;
            font-size: 1.2rem;
            display: block;
          }
          
          .brand-subtitle {
            font-weight: 400;
            color: #64b5f6;
            font-size: 0.9rem;
            display: block;
          }
          
          /* Navigation Items */
          .nav-item {
            margin: 0 4px;
          }
          
          .nav-link-custom {
            color: #e3f2fd !important;
            padding: 12px 20px !important;
            border-radius: 8px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            position: relative;
            font-weight: 500;
          }
          
          .nav-link-custom:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffd93d !important;
            transform: translateY(-2px);
          }
          
          .nav-link-custom.active {
            background: linear-gradient(45deg, #2196f3, #21cbf3);
            color: white !important;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
          }
          
          .nav-icon {
            font-size: 1.1rem;
          }
          
          /* Toggle Button */
          .navbar-toggler-custom {
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px 12px;
          }
          
          .navbar-toggler-custom span {
            color: white;
            font-size: 1.5rem;
            transition: transform 0.3s ease;
          }
          
          /* Collapse Menu */
          .navbar-collapse-custom {
            margin-top: 15px;
            border-radius: 12px;
            padding: 20px;
            background: rgba(26, 26, 46, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          }
          
          /* User Profile */
          .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 25px;
            margin-left: 20px;
          }
          
          .user-avatar {
            width: 36px;
            height: 36px;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
          }
          
          .user-name {
            color: white;
            font-weight: 500;
          }
          
          /* Notifications */
          .notifications-container {
            position: relative;
          }
          
          .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff4757;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            animation: bounce 2s infinite;
          }
          
          .notifications-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            min-width: 300px;
            z-index: 1000;
            margin-top: 10px;
            overflow: hidden;
          }
          
          .notification-item {
            padding: 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .notification-item:hover {
            background: #f8f9fa;
          }
          
          .notification-item.unread {
            background: #f0f8ff;
            font-weight: 500;
          }
          
          /* Logout Button */
          .logout-btn {
            background: linear-gradient(45deg, #ff6b6b, #ff4757);
            border: none;
            color: white !important;
            padding: 10px 20px !important;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
          
          .logout-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
          }
          
          /* Animations */
          @keyframes pulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.8; }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          
          /* Responsive */
          @media (max-width: 992px) {
            .navbar-collapse-custom {
              margin-top: 10px;
              padding: 15px;
            }
            
            .nav-item {
              margin: 5px 0;
            }
            
            .user-profile {
              margin: 15px 0 0 0;
              justify-content: center;
            }
            
            .notifications-dropdown {
              position: fixed;
              top: 80px;
              left: 20px;
              right: 20px;
              min-width: auto;
            }
          }
          
          /* Theme Toggle (Optional) */
          .theme-toggle {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .theme-toggle:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}
      </style>

      <nav className={`navbar navbar-expand-lg fixed-top navbar-custom ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="container-fluid">
          {/* Brand */}
          <Link className="navbar-brand" to="/" onClick={handleLinkClick}>
            <div className="brand-container">
              <span className="brand-icon">✨</span>
              <div>
                <span className="brand-title">Ritik's Insight Hub</span>
                <span className="brand-subtitle">NameVerse</span>
              </div>
            </div>
          </Link>

          {/* Toggle Button */}
          <button
            className="navbar-toggler navbar-toggler-custom"
            type="button"
            aria-expanded={!isCollapsed}
            aria-label="Toggle navigation"
            onClick={toggleNavbar}
          >
            <span className="navbar-toggler-icon">
              {isCollapsed ? '☰' : '✕'}
            </span>
          </button>

          {/* Navigation Menu */}
          <div className={`collapse navbar-collapse ${!isCollapsed ? 'show' : ''} navbar-collapse-custom`}>
            <ul className="navbar-nav ms-auto align-items-center">
              {/* Navigation Links */}
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/name') ? 'active' : ''}`}
                  to="/name" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">📝</i>
                  <span>Name Meaning</span>
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/game') ? 'active' : ''}`}
                  to="/game" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">🎮</i>
                  <span>Game</span>
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/search') ? 'active' : ''}`}
                  to="/search" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">🔍</i>
                  <span>YouTube Search</span>
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/gallery') ? 'active' : ''}`}
                  to="/gallery" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">📸</i>
                  <span>Photos</span>
                </Link>
              </li>
              {/* <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/LudoKing') ? 'active' : ''}`}
                  to="/LudoKing" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">📸</i>
                  <span>LudoKing</span>
                </Link>
              </li> */}
              
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/contact') ? 'active' : ''}`}
                  to="/contact" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">📧</i>
                  <span>Contact</span>
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom ${isActive('/payment') ? 'active' : ''}`}
                  to="/payment" 
                  onClick={handleLinkClick}
                >
                  <i className="nav-icon">❤️</i>
                  <span>Support</span>
                </Link>
              </li>

              {/* Notifications */}
              <li className="nav-item notifications-container">
                <button 
                  className="nav-link nav-link-custom"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <i className="nav-icon">🔔</i>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="notifications-dropdown">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          {notification.text}
                        </div>
                      ))
                    ) : (
                      <div className="notification-item text-center text-muted">
                        No notifications
                      </div>
                    )}
                  </div>
                )}
              </li>

              {/* Admin Section */}
              {!adminLoggedIn ? (
                <li className="nav-item">
                  <Link 
                    className={`nav-link nav-link-custom ${isActive('/admin-login') ? 'active' : ''}`}
                    to="/admin-login" 
                    onClick={handleLinkClick}
                  >
                    <i className="nav-icon">🔐</i>
                    <span>Admin Login</span>
                  </Link>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link nav-link-custom ${isActive('/admin-upload') ? 'active' : ''}`}
                      to="/admin-upload" 
                      onClick={handleLinkClick}
                    >
                      <i className="nav-icon">📤</i>
                      <span>Upload Media</span>
                    </Link>
                  </li>
                  
                  {/* User Profile */}
                  {userProfile && (
                    <li className="nav-item d-none d-lg-block">
                      <div className="user-profile">
                        <div className="user-avatar">
                          {userProfile.avatar || userProfile.name?.[0] || 'U'}
                        </div>
                        <span className="user-name">{userProfile.name || 'Admin'}</span>
                      </div>
                    </li>
                  )}
                  
                  <li className="nav-item">
                    <button 
                      className="nav-link nav-link-custom logout-btn"
                      onClick={() => { onLogout(); handleLinkClick(); }}
                    >
                      <i className="nav-icon">🚪</i>
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              )}
              
              {/* Mobile User Profile */}
              {adminLoggedIn && userProfile && (
                <li className="nav-item d-lg-none mt-3">
                  <div className="user-profile w-100 justify-content-center">
                    <div className="user-avatar">
                      {userProfile.avatar || userProfile.name?.[0] || 'U'}
                    </div>
                    <span className="user-name">{userProfile.name || 'Admin'}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
      
      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div style={{ height: scrolled ? '70px' : '85px' }} />
    </>
  );
}

// Default props
Navbar.defaultProps = {
  adminLoggedIn: false,
  onLogout: () => console.log('Logged out'),
  userProfile: null
};