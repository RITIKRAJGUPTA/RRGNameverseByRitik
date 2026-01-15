import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  FiGrid, FiList, FiDownload, FiShare2, FiHeart, 
  FiSearch, FiFilter, FiZoomIn, FiX, FiPlay, 
  FiPause, FiVolume2, FiVolumeX, FiMaximize, 
  FiInfo, FiCalendar, FiImage, FiVideo, FiMusic, FiEye 
} from 'react-icons/fi';
import { FaExpandArrowsAlt, FaCompress } from 'react-icons/fa';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { saveAs } from 'file-saver';
import Masonry from 'react-masonry-css';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('masonry'); // masonry, grid, list
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [filteredImages, setFilteredImages] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showInfo, setShowInfo] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);
  const videoRefs = useRef({});

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Media', icon: <FiGrid /> },
    { id: 'images', name: 'Photos', icon: <FiImage /> },
    { id: 'videos', name: 'Videos', icon: <FiVideo /> },
    { id: 'audio', name: 'Audio', icon: <FiMusic /> }
  ];

  // Sample tags
  const availableTags = ['Nature', 'Portrait', 'Travel', 'Abstract', 'Art', 'Music', 'Documentary', 'Landscape'];

  // Initialize from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('galleryFavorites')) || [];
    setFavorites(savedFavorites);
  }, []);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/gallery/photos');
      
      if (res.data.success) {
        // Enhance images with metadata
        const enhancedImages = res.data.images.map((url, index) => ({
          id: `media-${index}-${Date.now()}`,
          url,
          type: getMediaType(url),
          title: `Media ${index + 1}`,
          description: `media content ${index + 1}`,
          date: new Date(Date.now() - index * 86400000).toISOString(), // Stagger dates
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          tags: [availableTags[Math.floor(Math.random() * availableTags.length)]],
          dimensions: `${Math.floor(Math.random() * 1920) + 800}x${Math.floor(Math.random() * 1080) + 600}`,
          size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`
        }));
        
        setImages(enhancedImages);
        setFilteredImages(enhancedImages);
      } else {
        setError('Failed to load media');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error fetching media. Using sample data.');
      
      // Fallback sample data
      const sampleImages = [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w-800',
        'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800',
        'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=800',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
      ].map((url, index) => ({
        id: `sample-${index}`,
        url,
        type: 'image',
        title: `Sample Image ${index + 1}`,
        description: `Beautiful sample image ${index + 1}`,
        date: new Date(Date.now() - index * 86400000).toISOString(),
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        tags: [availableTags[Math.floor(Math.random() * availableTags.length)]],
        dimensions: '1920x1080',
        size: '2.4 MB'
      }));
      
      setImages(sampleImages);
      setFilteredImages(sampleImages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let results = [...images];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(media => media.type === selectedCategory.slice(0, -1));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(media => 
        media.title.toLowerCase().includes(query) ||
        media.description.toLowerCase().includes(query) ||
        media.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      results = results.filter(media =>
        selectedTags.some(tag => media.tags.includes(tag))
      );
    }
    
    // Sort results
    if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      results.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'popular') {
      results.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'likes') {
      results.sort((a, b) => b.likes - a.likes);
    }
    
    setFilteredImages(results);
  }, [images, selectedCategory, searchQuery, selectedTags, sortBy]);

  const getMediaType = (url) => {
    if (url.match(/\.(mp4|mov|avi|webm|mkv)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg|flac)$/i)) return 'audio';
    return 'image';
  };

  const toggleFavorite = (mediaId) => {
    const newFavorites = favorites.includes(mediaId)
      ? favorites.filter(id => id !== mediaId)
      : [...favorites, mediaId];
    
    setFavorites(newFavorites);
    localStorage.setItem('galleryFavorites', JSON.stringify(newFavorites));
  };

  const downloadMedia = async (media) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      saveAs(blob, `${media.title}.${media.type === 'image' ? 'jpg' : media.type === 'video' ? 'mp4' : 'mp3'}`);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Please try again.');
    }
  };

  const shareMedia = async (media) => {
    const shareData = {
      title: media.title,
      text: media.description,
      url: media.url
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled:', err);
      }
    } else {
      navigator.clipboard.writeText(media.url);
      alert('Link copied to clipboard!');
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      setUploadProgress({ uploaded: 0, total: files.length });
      
      const response = await axios.post('http://localhost:5000/api/gallery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, percent: percentCompleted }));
        }
      });
      
      if (response.data.success) {
        fetchImages(); // Refresh gallery
        setUploadProgress(null);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
      setUploadProgress(null);
    }
  };

  const togglePlayPause = (mediaId) => {
    const video = videoRefs.current[mediaId];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(mediaId);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const breakpointColumnsObj = {
    default: viewMode === 'masonry' ? 4 : viewMode === 'grid' ? 3 : 1,
    1100: viewMode === 'masonry' ? 3 : viewMode === 'grid' ? 2 : 1,
    700: viewMode === 'masonry' ? 2 : viewMode === 'grid' ? 2 : 1,
    500: 1
  };

  const themes = {
    light: { bg: '#ffffff', card: '#f8f9fa', text: '#212529', accent: '#6366f1' },
    dark: { bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', accent: '#8b5cf6' },
    gallery: { bg: '#f8fafc', card: '#ffffff', text: '#334155', accent: '#ef4444' }
  };

  const currentTheme = themes[theme];

  const lightboxSlides = filteredImages.map(media => ({
    src: media.url,
    type: media.type === 'video' ? 'video' : 'image',
    ...(media.type === 'video' && { 
      sources: [{ src: media.url, type: 'video/mp4' }]
    })
  }));

  return (
    <>
      <style>
        {`
          .gallery-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            min-height: 100vh;
            transition: all 0.3s ease;
          }
          
          .gallery-header {
            background: linear-gradient(135deg, ${currentTheme.accent} 0%, #4f46e5 100%);
            padding: 40px 0;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
          }
          
          .gallery-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none" stroke="white" stroke-width="2" stroke-opacity="0.1"/></svg>') repeat;
            opacity: 0.2;
          }
          
          .media-card {
            background: ${currentTheme.card};
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(0, 0, 0, 0.08);
            position: relative;
          }
          
          .media-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          }
          
          .media-thumbnail {
            position: relative;
            overflow: hidden;
            aspect-ratio: ${viewMode === 'list' ? '16/9' : '4/3'};
            cursor: pointer;
          }
          
          .media-thumbnail img,
          .media-thumbnail video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
          }
          
          .media-card:hover .media-thumbnail img,
          .media-card:hover .media-thumbnail video {
            transform: scale(1.1);
          }
          
          .media-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 50%);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: flex-end;
            padding: 20px;
          }
          
          .media-card:hover .media-overlay {
            opacity: 1;
          }
          
          .media-actions {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            gap: 8px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
          }
          
          .media-card:hover .media-actions {
            opacity: 1;
            transform: translateY(0);
          }
          
          .action-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }
          
          .action-btn:hover {
            background: white;
            transform: scale(1.1);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          
          .media-info {
            padding: 20px;
          }
          
          .media-title {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .media-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 12px;
          }
          
          .media-tag {
            display: inline-block;
            background: rgba(99, 102, 241, 0.1);
            color: ${currentTheme.accent};
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            margin-right: 5px;
            margin-bottom: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .media-tag:hover {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .media-tag.selected {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .view-toggle {
            display: flex;
            gap: 5px;
            background: ${currentTheme.card};
            padding: 5px;
            border-radius: 12px;
          }
          
          .view-btn {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: ${currentTheme.text};
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .view-btn.active {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .search-input {
            padding: 12px 20px;
            border-radius: 12px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            background: ${currentTheme.card};
            color: ${currentTheme.text};
            width: 100%;
            transition: all 0.3s ease;
          }
          
          .search-input:focus {
            outline: none;
            border-color: ${currentTheme.accent};
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }
          
          .category-btn {
            padding: 10px 20px;
            border-radius: 12px;
            background: ${currentTheme.card};
            border: 2px solid rgba(0, 0, 0, 0.1);
            color: ${currentTheme.text};
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .category-btn.active {
            background: ${currentTheme.accent};
            color: white;
            border-color: ${currentTheme.accent};
          }
          
          .upload-area {
            border: 3px dashed ${currentTheme.accent};
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            background: rgba(99, 102, 241, 0.05);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .upload-area:hover {
            background: rgba(99, 102, 241, 0.1);
            transform: translateY(-5px);
          }
          
          .progress-bar {
            height: 6px;
            background: ${currentTheme.accent};
            border-radius: 3px;
            transition: width 0.3s ease;
          }
          
          .stats-card {
            background: linear-gradient(135deg, ${currentTheme.accent}, #4f46e5);
            color: white;
            padding: 20px;
            border-radius: 16px;
          }
          
          .loading-spinner {
            border: 4px solid rgba(99, 102, 241, 0.1);
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
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          
          .play-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: ${currentTheme.accent};
            cursor: pointer;
            opacity: 0;
            transition: all 0.3s ease;
          }
          
          .media-thumbnail:hover .play-btn {
            opacity: 1;
          }
          
          .masonry-grid {
            display: flex;
            margin-left: -15px;
            width: auto;
          }
          
          .masonry-grid_column {
            padding-left: 15px;
            background-clip: padding-box;
          }
          
          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }
          
          .empty-state-icon {
            font-size: 80px;
            color: ${currentTheme.accent};
            opacity: 0.3;
            margin-bottom: 20px;
          }
        `}
      </style>

      <div className="gallery-container" style={{ paddingTop: '80px' }}>
        {/* Header */}
        <div className="gallery-header">
          <div className="container">
            <div className="text-center mb-4">
              <h1 className="display-4 fw-bold text-white mb-3">
                📸 Media Gallery
              </h1>
              <p className="text-white opacity-75">
                Discover and organize your favorite photos and videos
              </p>
            </div>

            {/* Upload Area */}
            <div 
              className="upload-area mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
              <div className="mb-3">
                <FiImage size={48} color={currentTheme.accent} />
              </div>
              <h4>Drag & Drop or Click to Upload</h4>
              <p className="text-muted">Supports images, videos, and audio files</p>
              
              {uploadProgress && (
                <div className="mt-3">
                  <div className="progress-bar" style={{ width: `${uploadProgress.percent}%` }} />
                  <p className="mt-2 mb-0">Uploading... {uploadProgress.percent}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container py-4">
          {/* Controls Bar */}
          <div className="row mb-4">
            <div className="col-md-8">
              <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
                {/* Search */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div className="position-relative">
                    <FiSearch className="position-absolute top-50 start-3 translate-middle-y" />
                    <input
                      type="text"
                      className="search-input ps-5"
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Categories */}
                <div className="d-flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.icon}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tags */}
              <div className="mb-3">
                <div className="d-flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <span
                      key={tag}
                      className={`media-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      #{tag}
                    </span>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      className="media-tag"
                      onClick={() => setSelectedTags([])}
                      style={{ background: '#ef4444', color: 'white' }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="d-flex justify-content-end gap-3">
                {/* View Toggle */}
                <div className="view-toggle">
                  {['masonry', 'grid', 'list'].map(mode => (
                    <button
                      key={mode}
                      className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                      onClick={() => setViewMode(mode)}
                      title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
                    >
                      {mode === 'masonry' ? '▦' : mode === 'grid' ? '◼◼' : '≡'}
                    </button>
                  ))}
                </div>
                
                {/* Sort Dropdown */}
                <select
                  className="form-select form-select-sm w-auto"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ background: currentTheme.card, color: currentTheme.text }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="likes">Most Liked</option>
                </select>
                
                {/* Theme Selector */}
                <select
                  className="form-select form-select-sm w-auto"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{ background: currentTheme.card, color: currentTheme.text }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="gallery">Gallery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="stats-card">
                <div className="d-flex align-items-center">
                  <FiImage size={24} />
                  <div className="ms-3">
                    <h4 className="mb-0">{filteredImages.length}</h4>
                    <small>Total Media</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <div className="d-flex align-items-center">
                  <FiHeart size={24} />
                  <div className="ms-3">
                    <h4 className="mb-0">{favorites.length}</h4>
                    <small>Favorites</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <div className="d-flex align-items-center">
                  <FiVideo size={24} />
                  <div className="ms-3">
                    <h4 className="mb-0">{filteredImages.filter(m => m.type === 'video').length}</h4>
                    <small>Videos</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <div className="d-flex align-items-center">
                  <FiCalendar size={24} />
                  <div className="ms-3">
                    <h4 className="mb-0">{new Date().getFullYear()}</h4>
                    <small>Current Year</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="loading-spinner mx-auto mb-3"></div>
              <p>Loading gallery...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="alert alert-danger" role="alert">
              {error}
              <button 
                className="btn btn-outline-danger btn-sm ms-3"
                onClick={fetchImages}
              >
                Retry
              </button>
            </div>
          )}

          {/* Gallery Content */}
          {!loading && !error && (
            <>
              {filteredImages.length > 0 ? (
                <div className={`${viewMode === 'masonry' ? 'masonry-grid' : viewMode === 'grid' ? 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4' : 'd-flex flex-column gap-4'}`}>
                  {viewMode === 'masonry' ? (
                    <Masonry
                      breakpointCols={breakpointColumnsObj}
                      className="masonry-grid"
                      columnClassName="masonry-grid_column"
                    >
                      {filteredImages.map((media, index) => (
                        <div key={media.id} className="mb-4">
                          <MediaCard 
                            media={media} 
                            index={index}
                            favorites={favorites}
                            viewMode={viewMode}
                            currentTheme={currentTheme}
                            toggleFavorite={toggleFavorite}
                            downloadMedia={downloadMedia}
                            shareMedia={shareMedia}
                            openLightbox={openLightbox}
                            togglePlayPause={togglePlayPause}
                            isPlaying={isPlaying}
                            videoRefs={videoRefs}
                            showInfo={showInfo}
                            setShowInfo={setShowInfo}
                          />
                        </div>
                      ))}
                    </Masonry>
                  ) : (
                    filteredImages.map((media, index) => (
                      <div key={media.id} className={viewMode === 'grid' ? 'col' : ''}>
                        <MediaCard 
                          media={media} 
                          index={index}
                          favorites={favorites}
                          viewMode={viewMode}
                          currentTheme={currentTheme}
                          toggleFavorite={toggleFavorite}
                          downloadMedia={downloadMedia}
                          shareMedia={shareMedia}
                          openLightbox={openLightbox}
                          togglePlayPause={togglePlayPause}
                          isPlaying={isPlaying}
                          videoRefs={videoRefs}
                          showInfo={showInfo}
                          setShowInfo={setShowInfo}
                        />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FiImage />
                  </div>
                  <h4>No media found</h4>
                  <p className="text-muted">
                    {searchQuery || selectedTags.length > 0 || selectedCategory !== 'all'
                      ? 'Try changing your filters or search terms'
                      : 'Upload some media to get started!'}
                  </p>
                  {!searchQuery && selectedTags.length === 0 && selectedCategory === 'all' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Media
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
      />
    </>
  );
}

// Media Card Component
const MediaCard = ({ 
  media, 
  index, 
  favorites, 
  viewMode, 
  currentTheme,
  toggleFavorite,
  downloadMedia,
  shareMedia,
  openLightbox,
  togglePlayPause,
  isPlaying,
  videoRefs,
  showInfo,
  setShowInfo
}) => {
  const isFavorite = favorites.includes(media.id);

  return (
    <div className="media-card fade-in">
      <div 
        className="media-thumbnail"
        onClick={() => openLightbox(index)}
      >
        {media.type === 'video' ? (
          <>
            <video
              ref={el => videoRefs.current[media.id] = el}
              src={media.url}
              poster={media.thumbnail}
              muted
              loop
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause(media.id);
              }}
            />
            <button
              className="play-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause(media.id);
              }}
            >
              {isPlaying === media.id ? <FiPause /> : <FiPlay />}
            </button>
          </>
        ) : (
          <img
            src={media.url}
            alt={media.title}
            loading="lazy"
          />
        )}
        
        <div className="media-overlay">
          <div>
            <h6 className="text-white mb-1">{media.title}</h6>
            <p className="text-white opacity-75 mb-0">{media.description}</p>
          </div>
        </div>
        
        <div className="media-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(media.id);
            }}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <FiHeart fill={isFavorite ? currentTheme.accent : 'none'} />
          </button>
          
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              downloadMedia(media);
            }}
            title="Download"
          >
            <FiDownload />
          </button>
          
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              shareMedia(media);
            }}
            title="Share"
          >
            <FiShare2 />
          </button>
          
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(prev => ({
                ...prev,
                [media.id]: !prev[media.id]
              }));
            }}
            title="Info"
          >
            <FiInfo />
          </button>
        </div>
        
        <div className="position-absolute top-0 start-0 p-3">
          <span className="badge bg-dark bg-opacity-50">
            {media.type.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="media-info">
        <h6 className="media-title">{media.title}</h6>
        
        {showInfo[media.id] && (
          <div className="mb-3">
            <p className="small text-muted mb-2">{media.description}</p>
            <div className="d-flex justify-content-between small text-muted">
              <span>{media.dimensions}</span>
              <span>{media.size}</span>
              <span>{new Date(media.date).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        
        <div className="media-meta">
          <div>
            <FiEye className="me-1" />
            <span className="me-3">{media.views}</span>
            <FiHeart className="me-1" />
            <span>{media.likes}</span>
          </div>
          <div className="d-flex align-items-center">
            {media.tags.map(tag => (
              <span
                key={tag}
                className="badge bg-primary bg-opacity-10 text-primary me-1"
                style={{ fontSize: '0.7rem' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};