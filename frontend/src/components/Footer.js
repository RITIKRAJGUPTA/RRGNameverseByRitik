import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHeart, FiGithub, FiLinkedin, FiTwitter, FiMail, FiCode,
  FiCoffee, FiStar, FiUsers, FiTrendingUp, FiArrowUp,
  FiShield, FiGlobe, FiMapPin, FiClock, FiRss
} from 'react-icons/fi';
import { FaReact, FaNodeJs, FaPython, FaDocker } from 'react-icons/fa';
import { SiMongodb, SiExpress, SiRedux } from 'react-icons/si';

export default function Footer() {
  const [currentTime, setCurrentTime] = useState('');
  const [visitorCount, setVisitorCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const location = useLocation();

  const socialLinks = [
    { icon: <FiGithub />, url: 'https://github.com/RITIKRAJGUPTA', label: 'GitHub' },
    { icon: <FiLinkedin />, url: 'https://www.linkedin.com/in/rrgritik2001/', label: 'LinkedIn' },
    { icon: <FiMail />, url: 'mailto:ritikrajgupta2001@gmail.com', label: 'Email' },
  ];

  const techStack = [
    { icon: <FaReact />, name: 'React', color: '#61DAFB' },
    { icon: <SiRedux />, name: 'Redux', color: '#764ABC' },
    { icon: <FaNodeJs />, name: 'Node.js', color: '#339933' },
    { icon: <SiExpress />, name: 'Express', color: '#000000' },
    { icon: <SiMongodb />, name: 'MongoDB', color: '#47A248' },
    { icon: <FaPython />, name: 'Python', color: '#3776AB' },
    { icon: <FaDocker />, name: 'Docker', color: '#2496ED' }
  ];

  const quickLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/name', label: 'Name Meaning', icon: '📝' },
    { path: '/game', label: 'Rock Paper Scissors', icon: '🎮' },
    { path: '/search', label: 'YouTube Search', icon: '🔍' },
    { path: '/gallery', label: 'Gallery', icon: '📸' },
    { path: '/contact', label: 'Contact', icon: '📧' },
    { path: '/payment', label: 'Support', icon: '❤️' },
  ];

  useEffect(() => {
    // Update current time
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);

    // Load visitor count from localStorage
    const count = parseInt(localStorage.getItem('visitorCount') || '0');
    const newCount = count + 1;
    localStorage.setItem('visitorCount', newCount.toString());
    setVisitorCount(newCount);

    // Handle scroll to show back-to-top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);

    // Load theme from localStorage or based on time
    const hour = new Date().getHours();
    const savedTheme = localStorage.getItem('footerTheme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(hour >= 18 || hour < 6 ? 'dark' : 'light');
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    // Simulate newsletter subscription
    const subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions') || '[]');
    subscriptions.push({
      email: newsletterEmail,
      subscribedAt: new Date().toISOString()
    });
    localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));

    setNewsletterSubscribed(true);
    setNewsletterEmail('');

    setTimeout(() => {
      setNewsletterSubscribed(false);
    }, 3000);
  };

  const themes = {
    dark: {
      bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      text: '#f1f5f9',
      card: 'rgba(30, 41, 59, 0.7)',
      accent: '#8b5cf6'
    },
    light: {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      text: '#1e293b',
      card: 'rgba(255, 255, 255, 0.9)',
      accent: '#4a6cf7'
    },
    gradient: {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      card: 'rgba(255, 255, 255, 0.15)',
      accent: '#ffffff'
    }
  };

  const currentTheme = themes[theme];

  return (
    <>
      <style>
        {`
          .footer-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .footer-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, ${currentTheme.accent}, transparent);
          }
          
          .footer-section {
            background: ${currentTheme.card};
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .footer-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          }
          
          .social-link {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            color: ${currentTheme.text};
            font-size: 1.2rem;
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }
          
          .social-link:hover {
            background: ${currentTheme.accent};
            color: white;
            transform: translateY(-5px) scale(1.1);
            border-color: ${currentTheme.accent};
          }
          
          .quick-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 16px;
            border-radius: 12px;
            color: ${currentTheme.text};
            text-decoration: none;
            transition: all 0.3s ease;
            margin-bottom: 5px;
          }
          
          .quick-link:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
            color: ${currentTheme.accent};
          }
          
          .quick-link.active {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .tech-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            font-size: 1.5rem;
            transition: all 0.3s ease;
          }
          
          .tech-icon:hover {
            transform: translateY(-5px) scale(1.1);
            background: ${currentTheme.accent};
            color: white;
          }
          
          .newsletter-input {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 12px 20px;
            color: ${currentTheme.text};
            width: 100%;
            transition: all 0.3s ease;
          }
          
          .newsletter-input:focus {
            outline: none;
            border-color: ${currentTheme.accent};
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          }
          
          .newsletter-btn {
            background: ${currentTheme.accent};
            border: none;
            border-radius: 12px;
            padding: 12px 30px;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
            width: 100%;
          }
          
          .newsletter-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
          }
          
          .stats-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 15px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .scroll-top-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${currentTheme.accent};
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateY(20px);
          }
          
          .scroll-top-btn.show {
            opacity: 1;
            transform: translateY(0);
          }
          
          .scroll-top-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          
          .theme-selector {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
          }
          
          .theme-dot {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s ease;
          }
          
          .theme-dot.active {
            border-color: white;
            transform: scale(1.2);
          }
          
          .footer-wave {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="rgba(255,255,255,0.1)"/></svg>');
            opacity: 0.1;
          }
          
          .copyright {
            position: relative;
            padding: 20px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .copyright::before {
            content: '🚀';
            position: absolute;
            left: 50%;
            top: -15px;
            transform: translateX(-50%);
            background: ${currentTheme.bg};
            padding: 0 20px;
            font-size: 24px;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          .floating {
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-in {
            animation: fadeIn 0.5s ease-out;
          }
        `}
      </style>

      {/* Scroll to Top Button */}
      <button
        className={`scroll-top-btn ${showScrollTop ? 'show' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <FiArrowUp />
      </button>

      <footer className="footer-container pt-5">
        <div className="footer-wave"></div>
        
        <div className="container py-5">
          <div className="row g-4">
            {/* Brand & About */}
            <div className="col-lg-4">
              <div className="footer-section fade-in">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="tech-icon floating" style={{ background: currentTheme.accent }}>
                    <FiCode />
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0">Ritik's Insight Hub</h3>
                    <p className="text-muted mb-0">NameVerse</p>
                  </div>
                </div>
                
                <p className="mb-4">
                  A creative playground exploring names, games, media, and insights. 
                  Built with passion and cutting-edge technology.
                </p>
                
                <div className="d-flex gap-3 mb-4">
                  {socialLinks.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label={social.label}
                      title={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
                
                {/* Real-time Stats */}
                <div className="row g-3">
                  <div className="col-6">
                    <div className="stats-card">
                      <FiUsers className="mb-2" size={20} />
                      <h5 className="mb-1">{visitorCount.toLocaleString()}</h5>
                      <small>Visitors</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="stats-card">
                      <FiClock className="mb-2" size={20} />
                      <h5 className="mb-1">{currentTime}</h5>
                      <small>Current Time</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-lg-4">
              <div className="footer-section fade-in">
                <h4 className="fw-bold mb-4">
                  <FiTrendingUp className="me-2" />
                  Quick Navigation
                </h4>
                
                <div className="row">
                  <div className="col-6">
                    {quickLinks.slice(0, 4).map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`quick-link ${location.pathname === link.path ? 'active' : ''}`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="col-6">
                    {quickLinks.slice(4).map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`quick-link ${location.pathname === link.path ? 'active' : ''}`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-top">
                  <h5 className="fw-bold mb-3">
                    <FiShield className="me-2" />
                    Important Links
                  </h5>
                  <div className="d-flex flex-wrap gap-3">
                    <a
                      href="https://ritik-portfolio-1.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      Portfolio
                    </a>
                    <a
                      href="/privacy"
                      className="btn btn-sm btn-outline-primary"
                    >
                      Privacy Policy
                    </a>
                    <a
                      href="/terms"
                      className="btn btn-sm btn-outline-primary"
                    >
                      Terms of Service
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter & Tech Stack */}
            <div className="col-lg-4">
              <div className="footer-section fade-in">
                <h4 className="fw-bold mb-4">
                  <FiRss className="me-2" />
                  Stay Updated
                </h4>
                
                {/* Newsletter */}
                <div className="mb-4">
                  <p className="text-muted mb-3">
                    Subscribe to get updates on new features and projects.
                  </p>
                  
                  <form onSubmit={handleNewsletterSubmit}>
                    <div className="input-group mb-3">
                      <input
                        type="email"
                        className="newsletter-input"
                        placeholder="Your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="newsletter-btn">
                      {newsletterSubscribed ? 'Subscribed!' : 'Subscribe'}
                    </button>
                  </form>
                  
                  {newsletterSubscribed && (
                    <div className="alert alert-success mt-3 mb-0" role="alert">
                      <FiStar className="me-2" />
                      Thank you for subscribing!
                    </div>
                  )}
                </div>
                
                {/* Tech Stack */}
                <div className="mt-4 pt-4 border-top">
                  <h5 className="fw-bold mb-3">
                    <FiCode className="me-2" />
                    Built With
                  </h5>
                  <div className="d-flex flex-wrap gap-3">
                    {techStack.map((tech, idx) => (
                      <div
                        key={idx}
                        className="tech-icon"
                        style={{ color: tech.color }}
                        title={tech.name}
                      >
                        {tech.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="theme-selector fade-in">
            {Object.keys(themes).map((themeName) => (
              <div
                key={themeName}
                className={`theme-dot ${theme === themeName ? 'active' : ''}`}
                style={{ background: themes[themeName].bg }}
                onClick={() => {
                  setTheme(themeName);
                  localStorage.setItem('footerTheme', themeName);
                }}
                title={`${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme`}
              />
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="copyright fade-in">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                <small>
                  © {new Date().getFullYear()} Ritik's Insight Hub - NameVerse. All rights reserved.
                </small>
              </div>
              
              <div className="col-md-6 text-center text-md-end">
                <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-3">
                  <small className="d-flex align-items-center gap-1">
                    <FiCoffee />
                    Made with passion
                  </small>
                  <small className="d-flex align-items-center gap-1">
                    <FiHeart />
                    Powered by innovation
                  </small>
                  <small className="d-flex align-items-center gap-1">
                    <FiGlobe />
                    Hosted globally
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}