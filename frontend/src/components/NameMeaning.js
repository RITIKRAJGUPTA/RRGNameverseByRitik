import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FiSearch, FiBook, FiStar, FiShare2, FiCopy, 
  FiVolume2, FiDownload, FiHeart, FiGlobe, 
  FiTrendingUp, FiAward, FiRefreshCw 
} from 'react-icons/fi';
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function NameMeaning() {
  const [name, setName] = useState('');
  const [meaning, setMeaning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [nameOrigin, setNameOrigin] = useState('');
  const [popularity, setPopularity] = useState('');
  const [theme, setTheme] = useState('light');
  const [showShare, setShowShare] = useState(false);
  const [nameCount, setNameCount] = useState(0);
  const [insights, setInsights] = useState([]);
  const resultRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('nameHistory')) || [];
    const savedFavorites = JSON.parse(localStorage.getItem('nameFavorites')) || [];
    const savedCount = parseInt(localStorage.getItem('nameSearchCount')) || 0;
    
    setHistory(savedHistory);
    setFavorites(savedFavorites);
    setNameCount(savedCount);
  }, []);

  const getMeaning = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    setError('');
    setMeaning('');
    setNameOrigin('');
    setPopularity('');
    setInsights([]);
    
    try {
      const { data } = await axios.post('https://rrgnameversebyritik.onrender.com/api/ai/meaning', { name });
      
      if (data.data && data.data.meaning) {
        const meaningText = data.data.meaning;
        const processedData = processMeaningResponse(meaningText);
        
        setMeaning(processedData.meaning);
        setNameOrigin(processedData.origin || '');
        setPopularity(processedData.popularity || '');
        setInsights(processedData.insights || []);
        
        // Add to history
        const newHistory = [
          { name, meaning: processedData.meaning, timestamp: new Date(), origin: processedData.origin },
          ...history.slice(0, 9)
        ];
        setHistory(newHistory);
        localStorage.setItem('nameHistory', JSON.stringify(newHistory));
        
        // Update search count
        const newCount = nameCount + 1;
        setNameCount(newCount);
        localStorage.setItem('nameSearchCount', newCount.toString());
        
        // Check if in favorites
        setIsFavorite(favorites.some(fav => fav.name.toLowerCase() === name.toLowerCase()));
        
        // Celebrate milestones
        if (newCount === 5 || newCount === 10 || newCount === 25) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Unable to fetch meaning. Please try again.');
      setMeaning(`The name "${name}" carries unique significance. While its exact meaning may vary across cultures, names often reflect hopes, virtues, or ancestral connections. Every name holds power and identity.`);
    } finally {
      setLoading(false);
    }
  };

  const processMeaningResponse = (text) => {
    // Parse the response for structured data
    const result = { meaning: text, origin: '', popularity: '', insights: [] };
    
    // Extract origin if mentioned
    const originKeywords = ['origin', 'derived from', 'comes from', 'rooted in'];
    originKeywords.forEach(keyword => {
      const match = text.toLowerCase().match(new RegExp(`${keyword}[^.]*\\.`, 'i'));
      if (match) {
        result.origin = match[0];
      }
    });
    
    // Generate insights based on meaning
    const insights = [
      "Names shape identity and destiny",
      "Every name carries ancestral wisdom",
      "Meaning evolves with cultural context",
      "Names connect us to heritage"
    ];
    result.insights = insights.slice(0, 2);
    
    // Simulate popularity
    const popularityLevels = ['Rare', 'Uncommon', 'Popular', 'Very Popular', 'Trending'];
    result.popularity = popularityLevels[Math.floor(Math.random() * popularityLevels.length)];
    
    return result;
  };

  const toggleFavorite = () => {
    const nameData = { 
      name, 
      meaning, 
      origin: nameOrigin, 
      timestamp: new Date(),
      popularity 
    };
    
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav.name.toLowerCase() !== name.toLowerCase());
      setIsFavorite(false);
    } else {
      newFavorites = [...favorites, nameData];
      setIsFavorite(true);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 }
      });
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('nameFavorites', JSON.stringify(newFavorites));
  };

  const copyToClipboard = async () => {
    const text = `Name: ${name}\nMeaning: ${meaning}\nOrigin: ${nameOrigin || 'Various origins'}\n\n- Discovered via Ritik's Insight Hub`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const speakMeaning = () => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(
        `The meaning of the name ${name} is: ${meaning}`
      );
      speech.lang = 'en-US';
      speech.rate = 0.9;
      speech.pitch = 1;
      
      speech.onstart = () => setIsSpeaking(true);
      speech.onend = () => setIsSpeaking(false);
      speech.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(speech);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const downloadResult = async () => {
    if (resultRef.current) {
      const canvas = await html2canvas(resultRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.setFillColor(250, 250, 255);
      pdf.rect(0, 0, 210, 297, 'F');
      
      pdf.setFontSize(24);
      pdf.setTextColor(74, 108, 247);
      pdf.text('Name Meaning Certificate', 105, 20, null, null, 'center');
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 28, null, null, 'center');
      
      pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);
      
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Ritik\'s Insight Hub - NameVerse • Discover Your Identity', 105, 280, null, null, 'center');
      
      pdf.save(`NameMeaning_${name}_${new Date().getTime()}.pdf`);
    }
  };

  const shareResult = (platform) => {
    const text = `Discovering the meaning of "${name}": ${meaning.substring(0, 100)}...\n\nExplore more at Ritik's Insight Hub!`;
    const url = window.location.href;
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=NameMeaning,Identity`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      default: `mailto:?subject=Meaning of the name ${name}&body=${encodeURIComponent(text + '\n\n' + url)}`
    };
    
    window.open(shareUrls[platform] || shareUrls.default, '_blank');
    setShowShare(false);
  };

  const clearHistory = () => {
    if (window.confirm('Clear all search history?')) {
      setHistory([]);
      localStorage.removeItem('nameHistory');
    }
  };

  const themes = {
    light: { bg: '#f8fafc', card: '#ffffff', text: '#1e293b', accent: '#4a6cf7' },
    dark: { bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', accent: '#60a5fa' },
    mystic: { bg: '#f0e7ff', card: '#ffffff', text: '#4c1d95', accent: '#8b5cf6' }
  };

  const currentTheme = themes[theme];

  return (
    <>
      <style>
        {`
          .name-meaning-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            min-height: 100vh;
            transition: all 0.3s ease;
          }
          
          .main-card {
            background: ${currentTheme.card};
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            border: 1px solid rgba(74, 108, 247, 0.1);
            position: relative;
            overflow: hidden;
          }
          
          .main-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4a6cf7, #8b5cf6, #ec4899);
          }
          
          .name-input {
            font-size: 1.2rem;
            padding: 20px 24px;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            transition: all 0.3s ease;
            background: ${currentTheme.card};
            color: ${currentTheme.text};
          }
          
          .name-input:focus {
            border-color: #4a6cf7;
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.1);
            transform: translateY(-2px);
          }
          
          .search-btn {
            background: linear-gradient(135deg, #4a6cf7 0%, #8b5cf6 100%);
            border: none;
            padding: 20px 40px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .search-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(74, 108, 247, 0.3);
          }
          
          .search-btn::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: rotate(30deg);
            transition: all 0.6s;
          }
          
          .search-btn:hover::after {
            left: 100%;
          }
          
          .meaning-card {
            background: linear-gradient(135deg, #f0f4ff 0%, #f8faff 100%);
            border-radius: 20px;
            padding: 30px;
            margin-top: 30px;
            border: 1px solid rgba(74, 108, 247, 0.15);
            animation: fadeInUp 0.6s ease-out;
          }
          
          .name-display {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #4a6cf7, #8b5cf6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 20px;
          }
          
          .meaning-text {
            font-size: 1.2rem;
            line-height: 1.8;
            color: #475569;
            position: relative;
            padding-left: 20px;
            border-left: 4px solid #4a6cf7;
          }
          
          .action-btn {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(74, 108, 247, 0.1);
            border: 2px solid rgba(74, 108, 247, 0.2);
            color: #4a6cf7;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .action-btn:hover {
            background: rgba(74, 108, 247, 0.2);
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(74, 108, 247, 0.2);
          }
          
          .history-card {
            background: ${currentTheme.card};
            border-radius: 16px;
            padding: 20px;
            margin-top: 20px;
            border: 1px solid rgba(74, 108, 247, 0.1);
          }
          
          .history-item {
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 8px;
            background: rgba(74, 108, 247, 0.05);
            border-left: 3px solid #4a6cf7;
            transition: all 0.2s ease;
            cursor: pointer;
          }
          
          .history-item:hover {
            background: rgba(74, 108, 247, 0.1);
            transform: translateX(5px);
          }
          
          .favorite-badge {
            background: linear-gradient(135deg, #ff6b6b, #ff8e53);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
          }
          
          .share-dropdown {
            position: absolute;
            bottom: 100%;
            right: 0;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            padding: 10px;
            z-index: 1000;
            min-width: 150px;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          .stats-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px;
            padding: 20px;
          }
          
          .insight-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #10b981;
          }
        `}
      </style>

      <div className="name-meaning-container" style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Header */}
              <div className="text-center mb-5">
                <h1 className="display-4 fw-bold mb-3">
                  <FiBook className="me-3" style={{ color: '#4a6cf7' }} />
                  Discover Your Name's Meaning
                </h1>
                <p className="lead text-muted">
                  Uncover the hidden significance, cultural roots, and personal power behind your name
                </p>
                
                {/* Stats */}
                <div className="row justify-content-center mb-4">
                  <div className="col-auto">
                    <div className="stats-card">
                      <div className="d-flex align-items-center">
                        <FiTrendingUp size={24} />
                        <div className="ms-3">
                          <h4 className="mb-0">{nameCount}</h4>
                          <small>Names Explored</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="stats-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                      <div className="d-flex align-items-center">
                        <FiAward size={24} />
                        <div className="ms-3">
                          <h4 className="mb-0">{favorites.length}</h4>
                          <small>Favorites</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Card */}
              <div className="main-card">
                {/* Theme Selector */}
                <div className="d-flex justify-content-end mb-4">
                  <div className="btn-group">
                    {Object.entries(themes).map(([key, value]) => (
                      <button
                        key={key}
                        className={`btn btn-sm ${theme === key ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setTheme(key)}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div className="mb-4">
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0">
                      <FiSearch size={20} color="#4a6cf7" />
                    </span>
                    <input
                      type="text"
                      className="form-control name-input border-start-0"
                      placeholder="Enter a name to discover its meaning..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && getMeaning()}
                      disabled={loading}
                    />
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Names hold power. Discover yours.
                  </small>
                </div>

                {/* Search Button */}
                <div className="d-grid">
                  <button
                    className="search-btn text-white"
                    onClick={getMeaning}
                    disabled={loading || !name.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Discovering Meaning...
                      </>
                    ) : (
                      <>
                        <FiSearch className="me-2" />
                        Discover Meaning
                      </>
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger mt-4" role="alert">
                    {error}
                    <button 
                      className="btn btn-outline-danger btn-sm ms-3"
                      onClick={getMeaning}
                    >
                      <FiRefreshCw /> Retry
                    </button>
                  </div>
                )}

                {/* Results Section */}
                {meaning && !loading && (
                  <div ref={resultRef} className="meaning-card fade-in-up">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div>
                        <div className="name-display">{name}</div>
                        {nameOrigin && (
                          <div className="d-flex align-items-center mb-3">
                            <FiGlobe className="me-2" color="#64748b" />
                            <span className="text-muted">{nameOrigin}</span>
                          </div>
                        )}
                        {popularity && (
                          <span className="favorite-badge">
                            <FiTrendingUp className="me-1" />
                            {popularity}
                          </span>
                        )}
                      </div>
                      <button
                        className={`action-btn ${isFavorite ? 'active' : ''}`}
                        onClick={toggleFavorite}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <FiHeart size={20} fill={isFavorite ? '#ff4757' : 'none'} />
                      </button>
                    </div>

                    {/* Meaning */}
                    <div className="meaning-text mb-4">
                      <FaQuoteLeft className="me-2" color="#94a3b8" />
                      {meaning}
                      <FaQuoteRight className="ms-2" color="#94a3b8" />
                    </div>

                    {/* Insights */}
                    {insights.length > 0 && (
                      <div className="mb-4">
                        <h6 className="fw-bold mb-3">Key Insights</h6>
                        {insights.map((insight, idx) => (
                          <div key={idx} className="insight-card">
                            <FiStar className="me-2" color="#10b981" />
                            {insight}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-3 mt-4">
                      <button
                        className="action-btn"
                        onClick={isSpeaking ? stopSpeaking : speakMeaning}
                        title={isSpeaking ? "Stop Speaking" : "Listen"}
                      >
                        <FiVolume2 size={20} />
                      </button>

                      <button
                        className="action-btn"
                        onClick={copyToClipboard}
                        title="Copy to Clipboard"
                      >
                        {copied ? '✓' : <FiCopy size={20} />}
                      </button>

                      <div className="position-relative">
                        <button
                          className="action-btn"
                          onClick={() => setShowShare(!showShare)}
                          title="Share"
                        >
                          <FiShare2 size={20} />
                        </button>
                        {showShare && (
                          <div className="share-dropdown">
                            <div className="dropdown-item" onClick={() => shareResult('whatsapp')}>
                              WhatsApp
                            </div>
                            <div className="dropdown-item" onClick={() => shareResult('twitter')}>
                              Twitter
                            </div>
                            <div className="dropdown-item" onClick={() => shareResult('facebook')}>
                              Facebook
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        className="action-btn"
                        onClick={downloadResult}
                        title="Download Result"
                      >
                        <FiDownload size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* History Section */}
                {history.length > 0 && (
                  <div className="history-card mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold">Recent Searches</h6>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={clearHistory}
                      >
                        Clear All
                      </button>
                    </div>
                    {history.slice(0, 5).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="history-item"
                        onClick={() => {
                          setName(item.name);
                          getMeaning();
                        }}
                      >
                        <div className="d-flex justify-content-between">
                          <strong>{item.name}</strong>
                          <small className="text-muted">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </small>
                        </div>
                        <small className="text-muted d-block mt-1">
                          {item.meaning.substring(0, 60)}...
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Quote */}
              <div className="text-center mt-5">
                <p className="text-muted fst-italic">
                  "A name is the blueprint of the thing we call character. You ask, What's in a name? I answer, Just about everything you do."
                  <br />
                  <small>- Morris Mandel</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}