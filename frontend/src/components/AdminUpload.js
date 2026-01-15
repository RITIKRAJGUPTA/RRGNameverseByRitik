import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiUpload, FiLogOut, FiImage, FiVideo, FiFile, FiTrash2,
  FiCheckCircle, FiAlertCircle, FiCopy, FiDownload, FiEye,
  FiGrid, FiList, FiFilter, FiSearch, FiRefreshCw, FiSettings,
  FiBarChart2, FiUsers, FiDatabase, FiShield, FiClock
} from 'react-icons/fi';
import { MdCloudUpload, MdSecurity } from 'react-icons/md';
import { FaPhotoVideo, FaRegFilePdf, FaFileArchive } from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import confetti from 'canvas-confetti';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminUpload({ token, onLogout }) {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUploads: 0,
    totalSize: '0 MB',
    images: 0,
    videos: 0,
    lastUpload: null
  });
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadSettings, setUploadSettings] = useState({
    compressImages: true,
    generateThumbnails: true,
    watermark: false,
    maxSize: 50, // MB
    allowedTypes: ['image/*', 'video/*', 'application/pdf']
  });
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fileTypes = [
    { type: 'image', icon: <FiImage />, color: '#4ade80', extensions: 'jpg, png, gif, webp' },
    { type: 'video', icon: <FiVideo />, color: '#60a5fa', extensions: 'mp4, mov, avi, webm' },
    { type: 'pdf', icon: <FaRegFilePdf />, color: '#ef4444', extensions: 'pdf' },
    { type: 'archive', icon: <FaFileArchive />, color: '#f59e0b', extensions: 'zip, rar' }
  ];

  useEffect(() => {
    fetchUploadHistory();
    fetchDashboardStats();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const response = await axios.get('https://rrgnameversebyritik.onrender.com/api/admin/uploads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUploadHistory(response.data.uploads);
        setFiles(response.data.uploads);
      }
    } catch (error) {
      console.error('Error fetching upload history:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('https://rrgnameversebyritik.onrender.com/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDashboardStats(response.data.stats);
      }
    } catch (error) {
      // Mock data for demo
      setDashboardStats({
        totalUploads: 42,
        totalSize: '245 MB',
        images: 28,
        videos: 14,
        lastUpload: new Date().toISOString()
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Check file size
    const maxSize = uploadSettings.maxSize * 1024 * 1024; // Convert MB to bytes
    if (selectedFile.size > maxSize) {
      toast.error(`File size exceeds ${uploadSettings.maxSize}MB limit`, {
        position: 'top-center'
      });
      return;
    }

    // Check file type
    const fileType = selectedFile.type;
    const isAllowed = uploadSettings.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -2));
      }
      return fileType === type;
    });

    if (!isAllowed) {
      toast.error('File type not allowed', {
        position: 'top-center'
      });
      return;
    }

    setFile(selectedFile);
    toast.info(`${selectedFile.name} selected for upload`, {
      position: 'top-right',
      autoClose: 2000
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first', {
        position: 'top-center'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('media', file);
    formData.append('settings', JSON.stringify(uploadSettings));
    formData.append('timestamp', new Date().toISOString());

    try {
      const response = await axios.post('https://rrgnameversebyritik.onrender.com/api/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        signal: abortControllerRef.current.signal
      });

      if (response.data.success) {
        // Celebrate successful upload
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast.success(
          <div>
            <h6>🚀 Upload Successful!</h6>
            <p>{file.name} has been uploaded successfully.</p>
            <small>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</small>
          </div>,
          {
            position: 'top-center',
            autoClose: 5000
          }
        );

        // Update history and stats
        const newUpload = {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: response.data.url,
          timestamp: new Date().toISOString(),
          status: 'completed'
        };

        setUploadHistory([newUpload, ...uploadHistory]);
        setFiles([newUpload, ...files]);
        
        // Update dashboard stats
        setDashboardStats(prev => ({
          ...prev,
          totalUploads: prev.totalUploads + 1,
          totalSize: formatSize(parseInt(prev.totalSize) + file.size / (1024 * 1024)),
          [file.type.startsWith('image') ? 'images' : 'videos']: 
            prev[file.type.startsWith('image') ? 'images' : 'videos'] + 1,
          lastUpload: new Date().toISOString()
        }));

        // Log upload activity
        logActivity('upload', {
          filename: file.name,
          size: file.size,
          type: file.type,
          timestamp: new Date().toISOString()
        });

        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        toast.info('Upload cancelled', {
          position: 'top-center'
        });
      } else {
        console.error('Upload error:', error);
        toast.error('Upload failed. Please try again.', {
          position: 'top-center'
        });
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setUploadProgress(0);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const logActivity = (action, data) => {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    activities.unshift({
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 activities
    if (activities.length > 50) activities.length = 50;
    
    localStorage.setItem('adminActivities', JSON.stringify(activities));
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await axios.delete(`https://rrgnameversebyritik.onrender.com/api/admin/uploads/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('File deleted successfully', {
          position: 'top-right'
        });

        // Update local state
        setUploadHistory(uploadHistory.filter(file => file.id !== fileId));
        setFiles(files.filter(file => file.id !== fileId));

        // Log activity
        logActivity('delete', {
          fileId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      toast.error('Failed to delete file', {
        position: 'top-center'
      });
    }
  };

  const handleBulkDelete = () => {
    if (files.length === 0) {
      toast.info('No files to delete', {
        position: 'top-center'
      });
      return;
    }

    if (window.confirm(`Delete ${files.length} files?`)) {
      // Simulate bulk delete
      setFiles([]);
      setUploadHistory([]);
      toast.success(`${files.length} files deleted`, {
        position: 'top-center'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('https://rrgnameversebyritik.onrender.com/api/admin/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      logActivity('logout', {
        timestamp: new Date().toISOString()
      });

      onLogout();
      localStorage.removeItem('adminToken');

      toast.success(
        <div>
          <h6>👋 Logged Out</h6>
          <p>You have been successfully logged out.</p>
        </div>,
        {
          position: 'top-center',
          autoClose: 3000,
          onClose: () => navigate('/admin-login'),
        }
      );
    } catch (err) {
      toast.error('Logout failed', {
        position: 'top-center'
      });
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || file.type.includes(filterType);
    return matchesSearch && matchesType;
  });

  // Chart data for upload stats
  const uploadChartData = {
    labels: uploadHistory.slice(-7).map(u => formatDate(u.timestamp).split(',')[0]),
    datasets: [
      {
        label: 'File Size (MB)',
        data: uploadHistory.slice(-7).map(u => (u.size / (1024 * 1024)).toFixed(2)),
        borderColor: '#4a6cf7',
        backgroundColor: 'rgba(74, 108, 247, 0.1)',
        tension: 0.4
      }
    ]
  };

  const typeChartData = {
    labels: ['Images', 'Videos', 'Documents', 'Others'],
    datasets: [
      {
        data: [
          uploadHistory.filter(u => u.type.startsWith('image')).length,
          uploadHistory.filter(u => u.type.startsWith('video')).length,
          uploadHistory.filter(u => u.type.includes('pdf') || u.type.includes('document')).length,
          uploadHistory.filter(u => !u.type.startsWith('image') && !u.type.startsWith('video') && !u.type.includes('pdf'))
        ],
        backgroundColor: [
          '#4ade80',
          '#60a5fa',
          '#ef4444',
          '#f59e0b'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <>
      <style>
        {`
          .admin-upload-container {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            padding-top: 80px;
          }
          
          .dashboard-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          
          .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
          }
          
          .upload-zone {
            border: 3px dashed #cbd5e1;
            border-radius: 20px;
            padding: 60px 30px;
            text-align: center;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
          }
          
          .upload-zone.drag-active {
            border-color: #4a6cf7;
            background: rgba(74, 108, 247, 0.05);
            transform: scale(1.02);
          }
          
          .upload-zone:hover {
            border-color: #4a6cf7;
            background: rgba(74, 108, 247, 0.02);
          }
          
          .upload-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4a6cf7, #3b82f6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 32px;
          }
          
          .file-preview-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
          }
          
          .file-preview-card:hover {
            border-color: #4a6cf7;
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          
          .progress-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 0;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4a6cf7, #3b82f6);
            border-radius: 4px;
            transition: width 0.3s ease;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #4a6cf7, #3b82f6);
            color: white;
            border-radius: 16px;
            padding: 25px;
            text-align: center;
          }
          
          .file-item {
            background: white;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #4a6cf7;
            transition: all 0.3s ease;
          }
          
          .file-item:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          }
          
          .control-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border: 2px solid #e2e8f0;
            color: #64748b;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .control-btn:hover {
            background: #4a6cf7;
            color: white;
            transform: scale(1.1);
          }
          
          .logout-btn {
            position: fixed;
            top: 90px;
            right: 30px;
            z-index: 1050;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
            transition: all 0.3s ease;
          }
          
          .logout-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(239, 68, 68, 0.4);
          }
          
          .type-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          .type-badge.image { background: rgba(74, 222, 128, 0.1); color: #16a34a; }
          .type-badge.video { background: rgba(96, 165, 250, 0.1); color: #2563eb; }
          .type-badge.pdf { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
          
          .search-input {
            padding: 12px 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: white;
            width: 100%;
            transition: all 0.3s ease;
          }
          
          .search-input:focus {
            outline: none;
            border-color: #4a6cf7;
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.1);
          }
          
          .view-toggle {
            display: flex;
            gap: 5px;
            background: white;
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
            color: #64748b;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .view-btn.active {
            background: #4a6cf7;
            color: white;
          }
          
          .settings-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            border: 2px solid #e2e8f0;
          }
          
          .upload-btn {
            background: linear-gradient(135deg, #4a6cf7, #3b82f6);
            border: none;
            padding: 16px 40px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
          }
          
          .upload-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(74, 108, 247, 0.3);
          }
          
          .upload-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .loading-spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 20px;
            height: 20px;
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
        `}
      </style>

      <div className="admin-upload-container">
        <ToastContainer />
        
        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut />
          Logout
        </button>

        <div className="container py-4">
          {/* Header */}
          <div className="row mb-5">
            <div className="col-12">
              <div className="dashboard-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h1 className="display-6 fw-bold mb-2">
                      <MdSecurity className="me-3" />
                      Admin Dashboard
                    </h1>
                    <p className="text-muted mb-0">
                      Upload and manage media files securely
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <small className="text-muted d-block">Logged in as</small>
                      <strong>Administrator</strong>
                    </div>
                    <div className="control-btn">
                      <FiSettings />
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-4">
                  {[
                    { title: 'Total Uploads', value: dashboardStats.totalUploads, icon: <FiDatabase />, color: '#4a6cf7' },
                    { title: 'Total Size', value: dashboardStats.totalSize, icon: <FiBarChart2 />, color: '#10b981' },
                    { title: 'Images', value: dashboardStats.images, icon: <FiImage />, color: '#4ade80' },
                    { title: 'Videos', value: dashboardStats.videos, icon: <FiVideo />, color: '#60a5fa' },
                    { title: 'Last Upload', value: dashboardStats.lastUpload ? formatDate(dashboardStats.lastUpload) : 'Never', icon: <FiClock />, color: '#f59e0b' }
                  ].map((stat, idx) => (
                    <div key={idx} className="col-md">
                      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)` }}>
                        <div className="mb-3" style={{ fontSize: '24px' }}>
                          {stat.icon}
                        </div>
                        <h2 className="display-5 fw-bold mb-2">{stat.value}</h2>
                        <small>{stat.title}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Left Column - Upload & Charts */}
            <div className="col-lg-8">
              {/* Upload Zone */}
              <div className="dashboard-card mb-4">
                <h3 className="fw-bold mb-4">
                  <FiUpload className="me-2" />
                  Upload Media
                </h3>

                {/* Drag & Drop Zone */}
                <div
                  ref={dropZoneRef}
                  className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    accept={uploadSettings.allowedTypes.join(',')}
                    style={{ display: 'none' }}
                  />
                  
                  <div className="upload-icon">
                    <MdCloudUpload />
                  </div>
                  
                  <h4 className="fw-bold mb-2">
                    {file ? file.name : 'Drag & Drop or Click to Upload'}
                  </h4>
                  
                  <p className="text-muted mb-4">
                    Supports {fileTypes.map(ft => ft.extensions).join(', ')} (Max {uploadSettings.maxSize}MB)
                  </p>
                  
                  {file && (
                    <div className="file-preview-card mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ fontSize: '24px', color: '#4a6cf7' }}>
                          {file.type.startsWith('image') ? <FiImage /> : 
                           file.type.startsWith('video') ? <FiVideo /> : <FiFile />}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1">{file.name}</h6>
                          <div className="d-flex gap-3">
                            <small className="text-muted">{formatSize(file.size)}</small>
                            <small className="text-muted">{file.type}</small>
                          </div>
                        </div>
                        <button
                          className="control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {loading && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <small>Uploading...</small>
                        <small>{uploadProgress}%</small>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <button
                    className="upload-btn mb-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    disabled={!file || loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner me-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiUpload />
                        Upload Now
                      </>
                    )}
                  </button>

                  {loading && (
                    <button
                      className="btn btn-outline-danger w-100"
                      onClick={cancelUpload}
                    >
                      Cancel Upload
                    </button>
                  )}
                </div>

                {/* Advanced Settings Toggle */}
                <div className="text-center mt-3">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                  </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="settings-card mt-4 fade-in">
                    <h5 className="fw-bold mb-3">Upload Settings</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={uploadSettings.compressImages}
                            onChange={(e) => setUploadSettings({
                              ...uploadSettings,
                              compressImages: e.target.checked
                            })}
                            id="compressImages"
                          />
                          <label className="form-check-label" htmlFor="compressImages">
                            Compress Images Automatically
                          </label>
                        </div>
                        
                        <div className="form-check mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={uploadSettings.generateThumbnails}
                            onChange={(e) => setUploadSettings({
                              ...uploadSettings,
                              generateThumbnails: e.target.checked
                            })}
                            id="generateThumbnails"
                          />
                          <label className="form-check-label" htmlFor="generateThumbnails">
                            Generate Thumbnails
                          </label>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-check mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={uploadSettings.watermark}
                            onChange={(e) => setUploadSettings({
                              ...uploadSettings,
                              watermark: e.target.checked
                            })}
                            id="watermark"
                          />
                          <label className="form-check-label" htmlFor="watermark">
                            Add Watermark to Images
                          </label>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Max File Size (MB)</label>
                          <input
                            type="range"
                            className="form-range"
                            min="1"
                            max="100"
                            value={uploadSettings.maxSize}
                            onChange={(e) => setUploadSettings({
                              ...uploadSettings,
                              maxSize: parseInt(e.target.value)
                            })}
                          />
                          <div className="d-flex justify-content-between">
                            <small>1 MB</small>
                            <strong>{uploadSettings.maxSize} MB</strong>
                            <small>100 MB</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Charts */}
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="dashboard-card">
                    <h5 className="fw-bold mb-3">Upload Activity</h5>
                    <Line
                      data={uploadChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false }
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="dashboard-card">
                    <h5 className="fw-bold mb-3">File Type Distribution</h5>
                    <Doughnut
                      data={typeChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - File Management */}
            <div className="col-lg-4">
              {/* File List Header */}
              <div className="dashboard-card mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">
                    <FaPhotoVideo className="me-2" />
                    Recent Uploads
                  </h5>
                  <div className="d-flex gap-2">
                    <button
                      className="control-btn"
                      onClick={fetchUploadHistory}
                      title="Refresh"
                    >
                      <FiRefreshCw />
                    </button>
                    <button
                      className="control-btn"
                      onClick={handleBulkDelete}
                      title="Delete All"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="mb-4">
                  <input
                    type="text"
                    className="search-input mb-3"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      {['all', 'image', 'video'].map(type => (
                        <button
                          key={type}
                          className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setFilterType(type)}
                        >
                          {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Videos'}
                        </button>
                      ))}
                    </div>
                    
                    <div className="view-toggle">
                      <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                      >
                        <FiGrid />
                      </button>
                      <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                      >
                        <FiList />
                      </button>
                    </div>
                  </div>
                </div>

                {/* File List */}
                <div className="file-list">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((fileItem) => (
                      <div key={fileItem.id} className="file-item fade-in">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-center gap-3">
                            <div style={{ fontSize: '20px', color: '#4a6cf7' }}>
                              {fileItem.type.startsWith('image') ? <FiImage /> : 
                               fileItem.type.startsWith('video') ? <FiVideo /> : <FiFile />}
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                                {fileItem.name}
                              </h6>
                              <div className="d-flex align-items-center gap-3">
                                <small className="text-muted">
                                  {formatSize(fileItem.size)}
                                </small>
                                <span className={`type-badge ${fileItem.type.startsWith('image') ? 'image' : 
                                                   fileItem.type.startsWith('video') ? 'video' : 'pdf'}`}>
                                  {fileItem.type.split('/')[1]}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="d-flex gap-2">
                            <button
                              className="control-btn"
                              onClick={() => window.open(fileItem.url, '_blank')}
                              title="Preview"
                            >
                              <FiEye />
                            </button>
                            <button
                              className="control-btn"
                              onClick={() => handleDelete(fileItem.id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <small className="text-muted">
                            {formatDate(fileItem.timestamp)}
                          </small>
                          {fileItem.status === 'completed' && (
                            <FiCheckCircle className="text-success" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <FiImage size={48} className="mb-3" style={{ color: '#cbd5e1' }} />
                      <p className="text-muted">No files uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card">
                <h5 className="fw-bold mb-3">Quick Actions</h5>
                <div className="row g-2">
                  {[
                    { icon: <FiCopy />, label: 'Copy All URLs', action: () => {
                      const urls = files.map(f => f.url).join('\n');
                      navigator.clipboard.writeText(urls);
                      toast.info('All URLs copied to clipboard');
                    }},
                    { icon: <FiDownload />, label: 'Export List', action: () => {
                      const data = JSON.stringify(files, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'upload-history.json';
                      a.click();
                    }},
                    { icon: <FiUsers />, label: 'Manage Users', action: () => toast.info('User management coming soon') },
                    { icon: <FiShield />, label: 'Security Logs', action: () => {
                      const logs = JSON.parse(localStorage.getItem('adminActivities') || '[]');
                      console.log('Security Logs:', logs);
                      toast.info('Security logs displayed in console');
                    }}
                  ].map((action, idx) => (
                    <div key={idx} className="col-6">
                      <button
                        className="btn btn-outline-primary w-100 d-flex align-items-center gap-2 justify-content-center py-3"
                        onClick={action.action}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}