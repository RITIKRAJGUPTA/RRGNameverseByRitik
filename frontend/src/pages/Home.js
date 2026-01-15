import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { FiDownload, FiShare2, FiBook, FiRotateCw, FiVolume2, FiCopy, FiHeart } from 'react-icons/fi';
import { FaQuoteLeft, FaQuoteRight, FaWhatsapp, FaTwitter } from 'react-icons/fa';
import confetti from 'canvas-confetti';

export default function Home() {
  const [shlok, setShlok] = useState('');
  const [meaning, setMeaning] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('light');
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(1);
  const [cacheStatus, setCacheStatus] = useState('checking'); // checking, cached, fresh
  const [offlineMode, setOfflineMode] = useState(false);
  const audioRef = useRef(null);

  // Cache constants
  const CACHE_KEYS = {
    SHLOK: 'shlok_cache',
    FAVORITES: 'shlok_favorites',
    PREFERENCES: 'shlok_preferences',
    CACHE_TIMESTAMP: 'shlok_cache_timestamp',
    CACHE_VERSION: 'shlok_cache_v1' // Version for cache invalidation
  };

  // Cache duration - 24 hours in milliseconds
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load user preferences from cache first
      const savedTheme = localStorage.getItem('shlokTheme') || 'light';
      const savedFontSize = parseInt(localStorage.getItem('shlokFontSize')) || 18;
      const savedFavorites = JSON.parse(localStorage.getItem(CACHE_KEYS.FAVORITES)) || [];
      const savedStreak = parseInt(localStorage.getItem('dailyStreak')) || 1;
      
      setTheme(savedTheme);
      setFontSize(savedFontSize);
      setFavorites(savedFavorites);
      setDailyStreak(savedStreak);
      
      // Check for cached shlok
      const cachedShlok = getCachedShlok();
      const today = new Date().toDateString();
      
      if (cachedShlok) {
        // Show cached data immediately
        setShlok(cachedShlok.shlok);
        setMeaning(cachedShlok.meaning);
        setIsFavorite(favorites.some(fav => fav.shlok === cachedShlok.shlok));
        setCacheStatus('cached');
        setLoading(false);
        
        // Check if cache is stale (more than 24 hours old)
        const cacheAge = Date.now() - cachedShlok.timestamp;
        if (cacheAge > CACHE_DURATION) {
          setCacheStatus('stale');
          // Fetch fresh data in background
          fetchShlok(true); // background refresh
        }
      } else {
        // No cache available, fetch fresh data
        await fetchShlok();
      }
      
      // Update streak if it's a new day
      const lastVisit = localStorage.getItem('lastVisit');
      
      if (lastVisit !== today) {
        const newStreak = lastVisit ? dailyStreak + 1 : 1;
        setDailyStreak(newStreak);
        localStorage.setItem('dailyStreak', newStreak.toString());
        localStorage.setItem('lastVisit', today);
        
        if (newStreak % 7 === 0) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
      
      celebrateStreak();
      
      // Check network status
      checkNetworkStatus();
      
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize app');
      setLoading(false);
    }
  };

  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      setOfflineMode(true);
      const cachedShlok = getCachedShlok();
      if (!cachedShlok) {
        setError('You are offline and no cached shlok is available.');
      }
    } else {
      setOfflineMode(false);
    }
  };

  const getCachedShlok = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEYS.SHLOK);
      if (!cachedData) return null;
      
      const parsed = JSON.parse(cachedData);
      
      // Check cache version
      if (parsed.version !== CACHE_KEYS.CACHE_VERSION) {
        clearCache();
        return null;
      }
      
      // Check if cache is expired
      const cacheAge = Date.now() - parsed.timestamp;
      if (cacheAge > CACHE_DURATION) {
        // Cache is stale but can still be used
        return parsed;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const cacheShlok = (shlokData, meaningData) => {
    try {
      const cacheData = {
        shlok: shlokData,
        meaning: meaningData,
        timestamp: Date.now(),
        version: CACHE_KEYS.CACHE_VERSION,
        date: new Date().toDateString()
      };
      
      localStorage.setItem(CACHE_KEYS.SHLOK, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
      
      console.log('Shlok cached successfully');
    } catch (error) {
      console.error('Error caching shlok:', error);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.SHLOK);
      localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const prefetchNextShlok = async () => {
    // Prefetch tomorrow's shlok in background
    setTimeout(async () => {
      try {
        if (navigator.onLine) {
          await axios.get('http://localhost:5000/api/gita/daily-shlok');
          console.log('Next shlok prefetched');
        }
      } catch (error) {
        console.log('Prefetch failed, will retry later');
      }
    }, 5000); // Wait 5 seconds before prefetching
  };

  const fetchShlok = async (backgroundRefresh = false) => {
    if (!backgroundRefresh) {
      setLoading(true);
      setCacheStatus('checking');
    }
    
    try {
      setError(null);
      const res = await axios.get('http://localhost:5000/api/gita/daily-shlok', {
        timeout: 10000, // 10 second timeout
        headers: {
          'Cache-Control': 'max-age=86400', // Cache for 24 hours
          'If-None-Match': localStorage.getItem('shlok_etag') || ''
        }
      });
      
      const newShlok = res.data.shlok;
      const newMeaning = res.data.meaning;
      
      // Cache the response
      cacheShlok(newShlok, newMeaning);
      
      // Store ETag for conditional requests
      if (res.headers.etag) {
        localStorage.setItem('shlok_etag', res.headers.etag);
      }
      
      // Update state
      setShlok(newShlok);
      setMeaning(newMeaning);
      setIsFavorite(favorites.some(fav => fav.shlok === newShlok));
      
      if (!backgroundRefresh) {
        setCacheStatus('fresh');
        setLoading(false);
      }
      
      // Prefetch next shlok
      prefetchNextShlok();
      
    } catch (err) {
      console.error('Fetch error:', err);
      
      if (backgroundRefresh) {
        console.log('Background refresh failed, using cached data');
        return;
      }
      
      // Try to use cached data if available
      const cachedShlok = getCachedShlok();
      if (cachedShlok) {
        setShlok(cachedShlok.shlok);
        setMeaning(cachedShlok.meaning);
        setIsFavorite(favorites.some(fav => fav.shlok === cachedShlok.shlok));
        setCacheStatus('cached_offline');
        setOfflineMode(true);
        setError('Using cached data - Network unavailable');
      } else {
        setError('Unable to fetch shlok. Please check your connection.');
        // Fallback shlok
        setShlok('योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥');
        setMeaning('O Dhananjaya, perform your duty established in Yoga, renouncing attachment, and be even-minded in success and failure; evenness of mind is called Yoga.');
      }
      setLoading(false);
    }
  };

  const celebrateStreak = () => {
    if (dailyStreak >= 7) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }, 1000);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add background
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(139, 0, 0);
    doc.text('Bhagavad Gita Daily Shlok', 105, 20, null, null, 'center');
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 30, null, null, 'center');
    
    // Cache info for offline users
    if (offlineMode) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('* Downloaded from cache (Offline Mode)', 105, 40, null, null, 'center');
    }
    
    // Decorative line
    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    // Shlok
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('श्लोक:', 20, 70);
    doc.setFontSize(fontSize);
    doc.text(shlok, 20, 85, { maxWidth: 170 });
    
    // Meaning
    doc.setFontSize(16);
    doc.text('Meaning:', 20, 130);
    doc.setFontSize(12);
    doc.text(meaning, 20, 145, { maxWidth: 170 });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('From Ritik\'s Insight Hub - NameVerse', 105, 280, null, null, 'center');
    doc.text('ॐ शान्तिः शान्तिः शान्तिः', 105, 285, null, null, 'center');
    
    doc.save(`BhagavadGita_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(`${shlok}. Meaning: ${meaning}`);
      speech.lang = 'hi-IN';
      speech.rate = 0.8;
      speech.pitch = 1;
      
      speech.onstart = () => setIsSpeaking(true);
      speech.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(speech);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const copyToClipboard = async () => {
    const text = `"${shlok}"\n\nMeaning: ${meaning}\n\n- Bhagavad Gita via Ritik's Insight Hub`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleFavorite = () => {
    const newFavorites = isFavorite
      ? favorites.filter(fav => fav.shlok !== shlok)
      : [...favorites, { shlok, meaning, date: new Date().toISOString() }];
    
    setFavorites(newFavorites);
    setIsFavorite(!isFavorite);
    localStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(newFavorites));
    
    if (!isFavorite) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 }
      });
    }
  };

  const shareShlok = (platform) => {
    const text = `"${shlok}"\n\nMeaning: ${meaning}\n\n- Bhagavad Gita via Ritik's Insight Hub`;
    const url = window.location.href;
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      default: `mailto:?subject=Bhagavad Gita Shlok&body=${encodeURIComponent(text + '\n\n' + url)}`
    };
    
    window.open(shareUrls[platform] || shareUrls.default, '_blank');
    setShowShareOptions(false);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('shlokTheme', newTheme);
  };

  const adjustFontSize = (change) => {
    const newSize = Math.min(Math.max(fontSize + change, 14), 24);
    setFontSize(newSize);
    localStorage.setItem('shlokFontSize', newSize.toString());
  };

  const playBackgroundMusic = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

 

  const themes = {
    light: { bg: '#fefefe', text: '#2c3e50', card: 'white' },
    dark: { bg: '#1a1a2e', text: '#ecf0f1', card: '#16213e' },
    spiritual: { bg: '#fdf6e3', text: '#654321', card: '#faf3e0' }
  };

  const currentTheme = themes[theme];

  const CacheIndicator = () => {
    if (cacheStatus === 'cached') {
      return (
        <div className="cache-indicator" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '12px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#4caf50'
        }}>
          ⚡ Cached
        </div>
      );
    } else if (cacheStatus === 'stale') {
      return (
        <div className="cache-indicator" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '12px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#ff9800'
        }}>
          🔄 Updating...
        </div>
      );
    } else if (offlineMode) {
      return (
        <div className="cache-indicator" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(158, 158, 158, 0.1)',
          border: '1px solid rgba(158, 158, 158, 0.3)',
          borderRadius: '12px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#9e9e9e'
        }}>
          📴 Offline
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <style>
        {`
          .shlok-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            transition: all 0.3s ease;
            min-height: 100vh;
          }
          
          .shlok-card {
            background: ${currentTheme.card};
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(139,0,0,0.1);
          }
          
          .shlok-card::before {
            content: 'ॐ';
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 60px;
            opacity: 0.1;
            color: #8b0000;
            font-family: 'serif';
          }
          
          .shlok-text {
            font-size: ${fontSize}px;
            line-height: 1.6;
            font-family: 'Sanskrit Text', 'serif';
            margin: 30px 0;
            position: relative;
          }
          
          .meaning-text {
            font-size: ${Math.max(fontSize - 4, 14)}px;
            line-height: 1.8;
            font-style: italic;
            color: ${theme === 'dark' ? '#bdc3c7' : '#555'};
            border-left: 4px solid #8b0000;
            padding-left: 20px;
            margin: 30px 0;
          }
          
          .quote-icon {
            color: #8b0000;
            opacity: 0.3;
            font-size: 40px;
          }
          
          .control-btn {
            background: rgba(139, 0, 0, 0.1);
            border: 2px solid rgba(139, 0, 0, 0.2);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #8b0000;
          }
          
          .control-btn:hover {
            background: rgba(139, 0, 0, 0.2);
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(139,0,0,0.2);
          }
          
          .streak-badge {
            background: linear-gradient(45deg, #ff7e5f, #feb47b);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            animation: pulse 2s infinite;
          }
          
          .loading-spinner {
            border: 4px solid rgba(139,0,0,0.1);
            border-radius: 50%;
            border-top: 4px solid #8b0000;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }
          
          .cache-loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #4caf50;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
          }
          
          .marquee-effect {
            overflow: hidden;
            position: relative;
          }
          
          .marquee-effect::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100%;
            background: linear-gradient(to right, transparent, ${currentTheme.card});
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-in {
            animation: fadeIn 0.8s ease-out;
          }
          
          .share-dropdown {
            position: absolute;
            bottom: 100%;
            right: 0;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            padding: 10px;
            z-index: 1000;
          }
          
          .share-option {
            padding: 10px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 5px;
            transition: background 0.2s;
          }
          
          .share-option:hover {
            background: #f0f0f0;
          }
          
          .theme-selector {
            display: flex;
            gap: 10px;
            margin: 20px 0;
          }
          
          .theme-option {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid transparent;
          }
          
          .theme-option.active {
            border-color: #8b0000;
          }
          
          .cache-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
          }
          
          .cache-btn {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(139, 0, 0, 0.1);
            border: 1px solid rgba(139, 0, 0, 0.2);
            color: #8b0000;
          }
          
          .cache-btn:hover {
            background: rgba(139, 0, 0, 0.2);
          }
          
          .performance-badge {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.7rem;
            z-index: 1000;
            backdrop-filter: blur(10px);
          }
        `}
      </style>

      {/* Background Audio */}
      <audio ref={audioRef} loop>
        <source src="https://assets.mixkit.co/music/preview/mixkit-meditation-ambience-175.mp3" type="audio/mpeg" />
      </audio>

      {/* Performance Monitor */}
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-badge">
          ⚡ Cache: {cacheStatus} | {offlineMode ? 'Offline' : 'Online'}
        </div>
      )}

      <div className="shlok-container" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div className="container">
          {/* Header with Streak */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-4 fw-bold" style={{ color: '#8b0000' }}>
                <FiBook className="me-2" />
                Bhagavad Gita Daily Shlok
              </h1>
              <p className="text-muted">
                Wisdom for today and everyday
                {loading && cacheStatus === 'checking' && (
                  <span className="cache-loading"></span>
                )}
                {cacheStatus === 'cached' && (
                  <small className="ms-2 text-success">⚡ Loaded from cache</small>
                )}
              </p>
            </div>
            <div className="streak-badge">
              🔥 {dailyStreak} Day Streak
            </div>
          </div>

          {/* Theme Selector */}
          <div className="theme-selector justify-content-center">
            <div 
              className="theme-option active" 
              style={{ background: '#fefefe' }}
              onClick={() => changeTheme('light')}
              title="Light Theme"
            />
            <div 
              className="theme-option" 
              style={{ background: '#1a1a2e' }}
              onClick={() => changeTheme('dark')}
              title="Dark Theme"
            />
            <div 
              className="theme-option" 
              style={{ background: '#fdf6e3' }}
              onClick={() => changeTheme('spiritual')}
              title="Spiritual Theme"
            />
          </div>

          {/* Cache Controls */}
          <div className="cache-controls">
            <button className="cache-btn" onClick={() => fetchShlok(false)}>
              Force Refresh
            </button>
            {offlineMode && (
              <button className="cache-btn" onClick={() => window.location.reload()}>
                Retry Connection
              </button>
            )}
          </div>

          {/* Main Card */}
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="shlok-card fade-in">
                <CacheIndicator />
                
                {loading && cacheStatus === 'checking' ? (
                  <div className="text-center py-5">
                    <div className="loading-spinner mx-auto mb-3"></div>
                    <p className="mt-3">Loading divine wisdom...</p>
                    {offlineMode && (
                      <p className="text-warning">
                        Attempting to load cached content...
                      </p>
                    )}
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                    <button className="btn btn-outline-danger btn-sm ms-3" onClick={() => fetchShlok(false)}>
                      <FiRotateCw /> Try Again
                    </button>
                    {offlineMode && (
                      <button 
                        className="btn btn-outline-warning btn-sm ms-2" 
                        onClick={() => {
                          const cached = getCachedShlok();
                          if (cached) {
                            setShlok(cached.shlok);
                            setMeaning(cached.meaning);
                            setError(null);
                          }
                        }}
                      >
                        Use Cached Version
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="d-flex justify-content-center">
                        <FaQuoteLeft className="quote-icon me-2" />
                        <span className="text-muted">Daily Shlok • {new Date().toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                        <FaQuoteRight className="quote-icon ms-2" />
                      </div>
                      {cacheStatus === 'stale' && (
                        <small className="text-warning">
                          ⚡ Cached content, updating in background...
                        </small>
                      )}
                    </div>

                    {/* Font Size Controls */}
                    <div className="d-flex justify-content-end gap-2 mb-3">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => adjustFontSize(-2)}>
                        A-
                      </button>
                      <span className="align-self-center">Font: {fontSize}px</span>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => adjustFontSize(2)}>
                        A+
                      </button>
                    </div>

                    {/* Shlok Text */}
                    <div className="shlok-text text-center">
                      {shlok}
                    </div>

                    {/* Meaning */}
                    <div className="meaning-text">
                      <strong>Meaning:</strong> {meaning}
                    </div>

                    {/* Controls */}
                    <div className="d-flex justify-content-center flex-wrap gap-3 mt-5">
                      <button 
                        className="control-btn" 
                        onClick={() => fetchShlok(false)}
                        title="New Shlok"
                      >
                        <FiRotateCw size={20} />
                      </button>

                      <button 
                        className="control-btn" 
                        onClick={isSpeaking ? stopSpeaking : speakText}
                        title={isSpeaking ? "Stop Speaking" : "Listen"}
                      >
                        <FiVolume2 size={20} />
                      </button>

                      <button 
                        className="control-btn"
                        onClick={copyToClipboard}
                        title="Copy to Clipboard"
                      >
                        {copied ? '✓' : <FiCopy size={20} />}
                      </button>

                      <button 
                        className="control-btn" 
                        onClick={toggleFavorite}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <FiHeart size={20} fill={isFavorite ? '#ff4757' : 'none'} color={isFavorite ? '#ff4757' : '#8b0000'} />
                      </button>

                      <div className="position-relative">
                        <button 
                          className="control-btn" 
                          onClick={() => setShowShareOptions(!showShareOptions)}
                          title="Share"
                        >
                          <FiShare2 size={20} />
                        </button>
                        {showShareOptions && (
                          <div className="share-dropdown">
                            <div className="share-option" onClick={() => shareShlok('whatsapp')}>
                              <FaWhatsapp color="#25D366" /> WhatsApp
                            </div>
                            <div className="share-option" onClick={() => shareShlok('twitter')}>
                              <FaTwitter color="#1DA1F2" /> Twitter
                            </div>
                            <div className="share-option" onClick={() => shareShlok('email')}>
                              📧 Email
                            </div>
                          </div>
                        )}
                      </div>

                      {/* <button 
                        className="control-btn"
                        onClick={playBackgroundMusic}
                        title="Background Music"
                      >
                        🎵
                      </button> */}

                      <button 
                        className="control-btn btn-download"
                        onClick={downloadPDF}
                        title="Download PDF"
                        style={{ background: 'linear-gradient(45deg, #8b0000, #c0392b)' }}
                      >
                        <FiDownload size={20} color="white" />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="d-flex justify-content-center gap-4 mt-4 text-muted">
                      <small>Favorites: {favorites.length}</small>
                      <small>•</small>
                      <small>Cache: {cacheStatus}</small>
                      <small>•</small>
                      <small>Total Shloks Shared: 45,678</small>
                    </div>
                  </>
                )}
              </div>

              {/* Favorites Preview */}
              {favorites.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3">
                    <FiHeart className="me-2" color="#ff4757" />
                    Your Favorite Shloks ({favorites.length})
                  </h5>
                  <div className="row">
                    {favorites.slice(0, 3).map((fav, index) => (
                      <div key={index} className="col-md-4 mb-3">
                        <div className="card h-100" style={{ borderLeft: '4px solid #8b0000' }}>
                          <div className="card-body">
                            <p className="card-text small">{fav.shlok.substring(0, 80)}...</p>
                            <small className="text-muted">
                              {new Date(fav.date).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center mt-5 mb-5">
                <p className="text-muted">
                  "One who sees inaction in action, and action in inaction, is intelligent among men." 
                  <br />- Bhagavad Gita 4.18
                </p>
                <div className="mt-3" style={{ fontSize: '2rem', opacity: 0.3 }}>
                  ॐ शान्तिः शान्तिः शान्तिः
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}