import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { 
  FiSearch, FiFilter, FiYoutube, FiExternalLink, 
  FiThumbsUp, FiEye, FiClock, FiCalendar, 
  FiShare2, FiDownload, FiStar, FiTrendingUp,
  FiPlayCircle, FiMusic, FiFilm, FiBook, FiX
} from 'react-icons/fi';
import { FaYoutube, FaRegThumbsUp, FaUserCircle, FaPlay } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function YoutubeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    duration: 'any',
    type: 'all',
    date: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [watchHistory, setWatchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState({ searches: 0, watches: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [theme, setTheme] = useState('light');
  const [layout, setLayout] = useState('grid');
  const [showPlayer, setShowPlayer] = useState(false);
  const searchRef = useRef(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('ytHistory')) || [];
    const savedFavorites = JSON.parse(localStorage.getItem('ytFavorites')) || [];
    const savedStats = JSON.parse(localStorage.getItem('ytStats')) || { searches: 0, watches: 0 };
    
    setWatchHistory(savedHistory.slice(0, 20));
    setFavorites(savedFavorites);
    setStats(savedStats);
  }, []);

  const searchYouTube = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/youtube/search?q=${encodeURIComponent(searchTerm)}&maxResults=20`
      );
      
      // Add mock data for missing fields if needed
      const processedResults = (data.data || []).map(video => ({
        ...video,
        viewCount: video.viewCount || Math.floor(Math.random() * 1000000),
        duration: video.duration || 'PT' + (Math.floor(Math.random() * 10) + 1) + 'M' + (Math.floor(Math.random() * 60)) + 'S',
        rating: video.rating || (Math.random() * 5).toFixed(1)
      }));
      
      setResults(processedResults);
      
      // Update stats
      const newStats = { ...stats, searches: stats.searches + 1 };
      setStats(newStats);
      localStorage.setItem('ytStats', JSON.stringify(newStats));
      
      // Generate suggestions
      generateSuggestions(searchTerm);
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchYouTube, 600), []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const generateSuggestions = (term) => {
    const commonSuggestions = [
      `${term} tutorial`,
      `${term} music`,
      `${term} documentary`,
      `${term} review`,
      `${term} live`,
      `${term} news`,
      `${term} podcast`,
      `${term} interview`
    ];
    setSuggestions(commonSuggestions.slice(0, 5));
  };

  const applyFilters = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // Apply filters to results
    if (results.length > 0) {
      let filteredResults = [...results];
      
      // Sort results
      if (newFilters.sortBy === 'date') {
        filteredResults.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      } else if (newFilters.sortBy === 'views') {
        filteredResults.sort((a, b) => parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0));
      } else if (newFilters.sortBy === 'rating') {
        filteredResults.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
      }
      
      setResults(filteredResults);
    }
  };

  const formatViewCount = (count) => {
    if (!count) return '0 views';
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return duration;
      
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const seconds = match[3] ? parseInt(match[3]) : 0;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `0:${seconds.toString().padStart(2, '0')}`;
      }
    } catch {
      return duration;
    }
  };

  const addToWatchHistory = (video) => {
    const historyItem = {
      ...video,
      watchedAt: new Date().toISOString()
    };
    
    const newHistory = [historyItem, ...watchHistory.filter(item => item.videoId !== video.videoId)].slice(0, 20);
    setWatchHistory(newHistory);
    localStorage.setItem('ytHistory', JSON.stringify(newHistory));
    
    // Update watch stats
    const newStats = { ...stats, watches: stats.watches + 1 };
    setStats(newStats);
    localStorage.setItem('ytStats', JSON.stringify(newStats));
  };

  const toggleFavorite = (video) => {
    const isFavorited = favorites.some(fav => fav.videoId === video.videoId);
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = favorites.filter(fav => fav.videoId !== video.videoId);
    } else {
      newFavorites = [{ ...video, favoritedAt: new Date().toISOString() }, ...favorites];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('ytFavorites', JSON.stringify(newFavorites));
  };

  const downloadVideoInfo = async (video) => {
    const doc = new jsPDF();
    
    doc.setFillColor(255, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('YouTube Video Info', 105, 25, null, null, 'center');
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 105, 35, null, null, 'center');
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(video.title.substring(0, 80), 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Channel: ${video.channelTitle}`, 20, 80);
    doc.text(`Published: ${new Date(video.publishedAt).toLocaleDateString()}`, 20, 90);
    doc.text(`Views: ${formatViewCount(video.viewCount)}`, 20, 100);
    
    // Add description
    doc.text('Description:', 20, 120);
    const splitDescription = doc.splitTextToSize(video.description || 'No description', 170);
    doc.text(splitDescription, 20, 130);
    
    doc.save(`YouTube_${video.videoId}.pdf`);
  };

  const shareVideo = (video) => {
    const shareData = {
      title: video.title,
      text: `Check out this YouTube video: ${video.title}`,
      url: `https://youtube.com/watch?v=${video.videoId}`
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  const watchVideo = (video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
    addToWatchHistory(video);
  };

  const themes = {
    light: { bg: '#ffffff', card: '#f9f9f9', text: '#0f0f0f', accent: '#ff0000' },
    dark: { bg: '#0f0f0f', card: '#1f1f1f', text: '#ffffff', accent: '#ff3333' },
    youtube: { bg: '#f9f9f9', card: '#ffffff', text: '#030303', accent: '#ff0000' }
  };

  const currentTheme = themes[theme];

  return (
    <>
      <style>
        {`
          .youtube-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            min-height: 100vh;
            transition: all 0.3s ease;
          }
          
          .search-header {
            background: linear-gradient(135deg, ${currentTheme.accent} 0%, #cc0000 100%);
            padding: 40px 0;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
          }
          
          .search-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="rgba(255,255,255,0.1)" d="M30,30 Q50,10 70,30 T90,50 T70,70 T50,90 T30,70 T10,50 T30,30 Z"/></svg>') repeat;
            opacity: 0.1;
          }
          
          .search-input-container {
            position: relative;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .search-input {
            width: 100%;
            padding: 20px 60px 20px 30px;
            font-size: 1.2rem;
            border: none;
            border-radius: 50px;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            color: #000;
          }
          
          .search-input:focus {
            outline: none;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
            transform: translateY(-2px);
          }
          
          .search-btn {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: ${currentTheme.accent};
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .search-btn:hover {
            background: #cc0000;
            transform: translateY(-50%) scale(1.1);
          }
          
          .video-card {
            background: ${currentTheme.card};
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            position: relative;
          }
          
          .video-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }
          
          .video-thumbnail {
            position: relative;
            overflow: hidden;
            aspect-ratio: 16/9;
            cursor: pointer;
          }
          
          .video-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          
          .video-card:hover .video-thumbnail img {
            transform: scale(1.05);
          }
          
          .play-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .video-thumbnail:hover .play-overlay {
            opacity: 1;
          }
          
          .play-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
          }
          
          .duration-badge {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
          }
          
          .video-info {
            padding: 16px;
          }
          
          .video-title {
            font-weight: 600;
            font-size: 1rem;
            line-height: 1.4;
            margin-bottom: 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            cursor: pointer;
          }
          
          .video-channel {
            color: #606060;
            font-size: 0.9rem;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .video-stats {
            color: #606060;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .filters-panel {
            background: ${currentTheme.card};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
          }
          
          .filter-btn {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid rgba(255, 0, 0, 0.2);
            color: ${currentTheme.accent};
            padding: 8px 16px;
            border-radius: 20px;
            margin: 0 5px 10px;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .filter-btn:hover, .filter-btn.active {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .suggestions-bar {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 20px 0;
            margin-bottom: 20px;
          }
          
          .suggestion-chip {
            background: rgba(255, 0, 0, 0.05);
            border: 1px solid rgba(255, 0, 0, 0.1);
            padding: 10px 20px;
            border-radius: 25px;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
          }
          
          .suggestion-chip:hover {
            background: rgba(255, 0, 0, 0.1);
            transform: translateY(-2px);
          }
          
          .action-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.05);
            border: none;
            color: ${currentTheme.text};
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .action-btn:hover {
            background: rgba(255, 0, 0, 0.1);
            transform: scale(1.1);
          }
          
          .video-player-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
          }
          
          .player-container {
            width: 90%;
            max-width: 1200px;
            background: ${currentTheme.bg};
            border-radius: 12px;
            overflow: hidden;
            position: relative;
          }
          
          .close-player {
            position: absolute;
            top: 15px;
            right: 15px;
            background: ${currentTheme.accent};
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1001;
          }
          
          .player-iframe {
            width: 100%;
            aspect-ratio: 16/9;
            border: none;
          }
          
          .stats-card {
            background: linear-gradient(135deg, ${currentTheme.accent}, #cc0000);
            color: white;
            padding: 20px;
            border-radius: 12px;
          }
          
          .history-item {
            padding: 10px;
            border-radius: 8px;
            background: ${currentTheme.card};
            margin-bottom: 8px;
            border-left: 3px solid ${currentTheme.accent};
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .history-item:hover {
            transform: translateX(5px);
          }
          
          .layout-toggle {
            display: flex;
            gap: 5px;
            margin-left: auto;
          }
          
          .layout-btn {
            background: rgba(0, 0, 0, 0.05);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: ${currentTheme.text};
          }
          
          .layout-btn.active {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .loading-spinner {
            border: 4px solid rgba(255, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid ${currentTheme.accent};
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${currentTheme.accent};
            border-radius: 4px;
          }
        `}
      </style>

      <div className="youtube-container" style={{ paddingTop: '60px' }}>
        {/* Header */}
        <div className="search-header">
          <div className="container">
            <div className="text-center mb-4">
              <h1 className="display-4 fw-bold text-white mb-3">
                <FaYoutube className="me-3" />
                YouTube Search
              </h1>
              <p className="text-white opacity-75">
                Discover millions of videos with powerful search
              </p>
            </div>

            {/* Search Input */}
            <div className="search-input-container">
              <input
                ref={searchRef}
                type="text"
                className="search-input"
                placeholder="Search YouTube videos, channels, playlists..."
                value={query}
                onChange={handleChange}
                onKeyPress={(e) => e.key === 'Enter' && searchYouTube(query)}
              />
              <button className="search-btn" onClick={() => searchYouTube(query)}>
                <FiSearch size={20} />
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="suggestions-bar">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="suggestion-chip"
                    onClick={() => {
                      setQuery(suggestion);
                      searchYouTube(suggestion);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="container py-4">
          {/* Controls Bar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <button
                className={`btn ${showFilters ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="me-2" />
                Filters
              </button>
              
              <div className="layout-toggle">
                <button
                  className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
                  onClick={() => setLayout('grid')}
                  title="Grid View"
                >
                  ▦
                </button>
                <button
                  className={`layout-btn ${layout === 'list' ? 'active' : ''}`}
                  onClick={() => setLayout('list')}
                  title="List View"
                >
                  ≡
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="stats-card">
                <div className="d-flex align-items-center gap-3">
                  <div>
                    <h6 className="mb-0">Searches</h6>
                    <h4 className="mb-0">{stats.searches}</h4>
                  </div>
                  <div>
                    <h6 className="mb-0">Watches</h6>
                    <h4 className="mb-0">{stats.watches}</h4>
                  </div>
                </div>
              </div>
              
              <select
                className="form-select form-select-sm w-auto"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{ background: currentTheme.card, color: currentTheme.text }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel fade-in">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Sort by</label>
                  <div className="d-flex flex-wrap">
                    {['relevance', 'date', 'views', 'rating'].map((sort) => (
                      <button
                        key={sort}
                        className={`filter-btn ${filters.sortBy === sort ? 'active' : ''}`}
                        onClick={() => applyFilters('sortBy', sort)}
                      >
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <label className="form-label">Duration</label>
                  <div className="d-flex flex-wrap">
                    {['any', 'short', 'long'].map((duration) => (
                      <button
                        key={duration}
                        className={`filter-btn ${filters.duration === duration ? 'active' : ''}`}
                        onClick={() => applyFilters('duration', duration)}
                      >
                        {duration.charAt(0).toUpperCase() + duration.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="loading-spinner mx-auto mb-3"></div>
              <p>Searching YouTube...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
              <button 
                className="btn btn-outline-danger btn-sm ms-3"
                onClick={() => searchYouTube(query)}
              >
                Retry
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && !error && (
            <>
              {results.length > 0 ? (
                <div className={`${layout === 'grid' ? 'row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4' : ''} g-4`}>
                  {results.map((video) => (
                    <div key={video.videoId} className={layout === 'grid' ? 'col' : 'mb-4'}>
                      <div className={`video-card ${layout === 'list' ? 'd-flex' : ''}`}>
                        {/* Thumbnail */}
                        <div 
                          className={`video-thumbnail ${layout === 'list' ? 'flex-shrink-0' : ''}`} 
                          style={layout === 'list' ? { width: '320px' } : {}}
                          onClick={() => watchVideo(video)}
                        >
                          <img
                            src={video.thumbnails?.medium?.url || video.thumbnails?.default?.url || 'https://via.placeholder.com/320x180'}
                            alt={video.title}
                          />
                          <div className="play-overlay">
                            <div className="play-button">
                              <FaPlay />
                            </div>
                          </div>
                          <div className="duration-badge">
                            {formatDuration(video.duration)}
                          </div>
                          <div className="position-absolute top-0 end-0 p-2">
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(video);
                              }}
                              title={favorites.some(fav => fav.videoId === video.videoId) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <FiStar 
                                fill={favorites.some(fav => fav.videoId === video.videoId) ? '#ffd700' : 'none'} 
                                color={favorites.some(fav => fav.videoId === video.videoId) ? '#ffd700' : 'currentColor'}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="video-info flex-grow-1">
                          <h6 
                            className="video-title"
                            onClick={() => watchVideo(video)}
                          >
                            {video.title}
                          </h6>
                          
                          <div className="video-channel">
                            <FaUserCircle />
                            {video.channelTitle}
                          </div>
                          
                          <div className="video-stats">
                            <span>
                              <FiEye className="me-1" />
                              {formatViewCount(video.viewCount)}
                            </span>
                            <span>
                              <FiCalendar className="me-1" />
                              {new Date(video.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="d-flex gap-2 mt-3">
                            <a
                              href={`https://youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="action-btn"
                              title="Watch on YouTube"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiExternalLink />
                            </a>
                            
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                shareVideo(video);
                              }}
                              title="Share video"
                            >
                              <FiShare2 />
                            </button>
                            
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadVideoInfo(video);
                              }}
                              title="Download info"
                            >
                              <FiDownload />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-5">
                  <h4>No results found for "{query}"</h4>
                  <p className="text-muted">Try different keywords or check your spelling</p>
                </div>
              ) : (
                <div className="text-center py-5">
                  <FiYoutube size={80} color="#ff0000" className="mb-3" />
                  <h4>Search YouTube videos</h4>
                  <p className="text-muted">Enter keywords to find videos, channels, or playlists</p>
                </div>
              )}
            </>
          )}

          {/* Watch History */}
          {watchHistory.length > 0 && !loading && (
            <div className="mt-5">
              <h5 className="mb-3">
                <BiTimeFive className="me-2" />
                Recently Watched
              </h5>
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                {watchHistory.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="col">
                    <div 
                      className="history-item"
                      onClick={() => watchVideo(item)}
                    >
                      <img
                        src={item.thumbnails?.default?.url || 'https://via.placeholder.com/120x90'}
                        alt={item.title}
                        className="w-100 rounded mb-2"
                      />
                      <small className="d-block text-truncate">{item.title}</small>
                      <small className="text-muted">
                        {new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {showPlayer && selectedVideo && (
        <div className="video-player-modal">
          <div className="player-container">
            <button
              className="close-player"
              onClick={() => {
                setShowPlayer(false);
                setSelectedVideo(null);
              }}
            >
              <FiX />
            </button>
            
            <iframe
              className="player-iframe"
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            <div className="p-4">
              <h4>{selectedVideo.title}</h4>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1">{selectedVideo.channelTitle}</p>
                  <p className="text-muted mb-0">
                    {formatViewCount(selectedVideo.viewCount)} • {new Date(selectedVideo.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => {
                      toggleFavorite(selectedVideo);
                    }}
                  >
                    <FiStar className="me-2" />
                    {favorites.some(fav => fav.videoId === selectedVideo.videoId) ? 'Favorited' : 'Favorite'}
                  </button>
                  <a
                    href={`https://youtube.com/watch?v=${selectedVideo.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-danger"
                  >
                    <FiExternalLink className="me-2" />
                    Watch on YouTube
                  </a>
                </div>
              </div>
              {selectedVideo.description && (
                <div className="mt-3">
                  <p className="text-muted">{selectedVideo.description.substring(0, 200)}...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}