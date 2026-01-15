import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiLock, FiUser, FiEye, FiEyeOff, FiKey, FiShield, 
  FiAlertCircle, FiCheckCircle, FiLogIn, FiRefreshCw,
  FiMail, FiSmartphone, FiGlobe
} from 'react-icons/fi';
import { FaGoogle, FaGithub, FaMicrosoft } from 'react-icons/fa';
import ReCAPTCHA from 'react-google-recaptcha';
import confetti from 'canvas-confetti';
import { FiFingerprint } from "react-icons/fi";


export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('low');
  const [ipInfo, setIpInfo] = useState(null);
  const [showSecurityTips, setShowSecurityTips] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check if account is locked
  useEffect(() => {
    const lockData = JSON.parse(localStorage.getItem('adminLockData'));
    if (lockData && lockData.lockUntil > Date.now()) {
      setIsLocked(true);
      setLockUntil(lockData.lockUntil);
      startLockTimer(lockData.lockUntil);
    } else {
      localStorage.removeItem('adminLockData');
    }

    // Get IP info
    fetchIpInfo();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchIpInfo = async () => {
    try {
      const response = await axios.get('https://ipapi.co/json/');
      setIpInfo(response.data);
    } catch (err) {
      console.log('Could not fetch IP info');
    }
  };

  const startLockTimer = (lockUntil) => {
    const remaining = lockUntil - Date.now();
    if (remaining > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsLocked(false);
        setLockUntil(null);
        localStorage.removeItem('adminLockData');
      }, remaining);
    }
  };

  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      const lockDuration = 15 * 60 * 1000; // 15 minutes
      const lockUntil = Date.now() + lockDuration;
      setIsLocked(true);
      setLockUntil(lockUntil);
      
      localStorage.setItem('adminLockData', JSON.stringify({
        lockUntil,
        attempts: newAttempts
      }));

      startLockTimer(lockUntil);
      
      toast.error(`Account locked for 15 minutes. Too many failed attempts.`, {
        position: 'top-center',
        autoClose: 5000
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error('Account is temporarily locked. Please try again later.', {
        position: 'top-center'
      });
      return;
    }

    // if (!captchaToken) {
    //   toast.error('Please complete the CAPTCHA verification', {
    //     position: 'top-center'
    //   });
    //   return;
    // }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', { 
        username, 
        password,
        rememberMe
      }, {
        headers: {
          'X-Client-IP': ipInfo?.ip,
          'X-Client-Location': `${ipInfo?.city}, ${ipInfo?.country_name}`
        }
      });

      if (res.data.success) {
        // Reset login attempts on success
        localStorage.removeItem('adminLockData');
        setLoginAttempts(0);
        
        // Store token with security flags
        const tokenData = {
          token: res.data.token,
          expires: res.data.expires || Date.now() + 24 * 60 * 60 * 1000,
          user: res.data.user,
          permissions: res.data.permissions
        };
        
        localStorage.setItem('adminToken', JSON.stringify(tokenData));
        
        // Celebrate login
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Security audit log
        logSecurityEvent('successful_login', {
          username,
          ip: ipInfo?.ip,
          location: ipInfo?.city,
          timestamp: new Date().toISOString()
        });

        toast.success(
          <div>
            <h6>🚀 Login Successful!</h6>
            <p>Welcome back, {res.data.user?.name || 'Admin'}!</p>
          </div>,
          {
            position: 'top-center',
            autoClose: 3000,
            onClose: () => {
              onLogin(res.data.token);
              navigate(res.data.redirectTo || '/admin-upload');
            }
          }
        );

      } else {
        handleFailedLogin();
        setError(res.data.message || 'Invalid credentials');
        
        toast.error(res.data.message || 'Login failed', {
          position: 'top-center'
        });
      }
    } catch (err) {
      handleFailedLogin();
      setError('Login failed. Please try again.');
      
      // Security audit log for failed attempt
      logSecurityEvent('failed_login', {
        username,
        ip: ipInfo?.ip,
        timestamp: new Date().toISOString(),
        error: err.response?.data?.message
      });

      toast.error('Login failed. Please check your credentials.', {
        position: 'top-center'
      });
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
    }
  };

  const logSecurityEvent = (event, data) => {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    logs.unshift({
      event,
      ...data,
      id: Date.now()
    });
    
    // Keep only last 100 logs
    if (logs.length > 100) logs.length = 100;
    
    localStorage.setItem('securityLogs', JSON.stringify(logs));
  };

  const handleSSOLogin = (provider) => {
    toast.info(`SSO login with ${provider} is simulated in this demo`, {
      position: 'top-center'
    });
    
    // Simulate SSO login
    setTimeout(() => {
      toast.success(`Logged in via ${provider}!`, {
        position: 'top-center'
      });
      navigate('/admin-upload');
    }, 1500);
  };

  const handleForgotPassword = () => {
    toast.info('Password reset link has been sent to your email', {
      position: 'top-center'
    });
  };

  const getSecurityLevel = () => {
    let level = 'low';
    if (password.length >= 12) level = 'medium';
    if (password.length >= 16 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) level = 'high';
    if (password.length >= 20 && /[A-Z]/.test(password) && /[0-9]/.test(password)) level = 'very-high';
    return level;
  };

  const securityTips = [
    'Use a strong password with at least 12 characters',
    'Enable two-factor authentication for extra security',
    'Never share your login credentials',
    'Log out from public computers',
    'Regularly update your password'
  ];

  const ssoProviders = [
    { id: 'google', name: 'Google', icon: <FaGoogle />, color: '#DB4437' },
    { id: 'github', name: 'GitHub', icon: <FaGithub />, color: '#333' },
    { id: 'microsoft', name: 'Microsoft', icon: <FaMicrosoft />, color: '#00A4EF' }
  ];

  return (
    <>
      <style>
        {`
          .login-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: slideUp 0.6s ease-out;
          }
          
          .login-header {
            text-align: center;
            margin-bottom: 40px;
          }
          
          .login-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 32px;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }
          
          .form-group {
            margin-bottom: 24px;
          }
          
          .input-group {
            position: relative;
          }
          
          .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #667eea;
            z-index: 2;
          }
          
          .form-input {
            width: 100%;
            padding: 16px 16px 16px 48px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: white;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          
          .form-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
            transform: translateY(-2px);
          }
          
          .password-toggle {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            transition: color 0.3s;
          }
          
          .password-toggle:hover {
            color: #667eea;
          }
          
          .security-indicator {
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
          }
          
          .security-fill {
            height: 100%;
            border-radius: 2px;
            transition: all 0.3s ease;
          }
          
          .security-fill.low { 
            width: 25%; 
            background: #ef4444; 
          }
          .security-fill.medium { 
            width: 50%; 
            background: #f59e0b; 
          }
          .security-fill.high { 
            width: 75%; 
            background: #10b981; 
          }
          .security-fill.very-high { 
            width: 100%; 
            background: #3b82f6; 
          }
          
          .security-text {
            font-size: 0.8rem;
            margin-top: 4px;
            text-align: right;
          }
          
          .login-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            position: relative;
            overflow: hidden;
          }
          
          .login-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }
          
          .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .login-btn::after {
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
          
          .login-btn:hover::after {
            left: 100%;
          }
          
          .sso-btn {
            width: 100%;
            padding: 14px;
            border-radius: 10px;
            border: 2px solid #e2e8f0;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .sso-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          
          .security-tips-card {
            background: #f0f9ff;
            border: 2px solid #bae6fd;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
          }
          
          .lock-message {
            background: rgba(239, 68, 68, 0.1);
            border: 2px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
          }
          
          .two-factor-card {
            background: rgba(16, 185, 129, 0.05);
            border: 2px solid rgba(16, 185, 129, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            animation: fadeIn 0.5s ease;
          }
          
          .loading-spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
          }
          
          .ip-info {
            background: rgba(102, 126, 234, 0.05);
            border-radius: 8px;
            padding: 12px;
            font-size: 0.8rem;
            margin-top: 20px;
            border: 1px solid rgba(102, 126, 234, 0.1);
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          }
          
          .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            border: 2px solid #cbd5e1;
            cursor: pointer;
          }
          
          .checkbox-label input[type="checkbox"]:checked {
            background-color: #667eea;
            border-color: #667eea;
          }
          
          .forgot-link {
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s;
          }
          
          .forgot-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon">
              <FiShield />
            </div>
            <h2 className="fw-bold mb-2">Admin Portal</h2>
            <p className="text-muted">Secure access to administrative controls</p>
          </div>

          {/* Account Lock Warning */}
          {isLocked && (
            <div className="lock-message">
              <FiAlertCircle size={24} className="mb-2" style={{ color: '#ef4444' }} />
              <h5 className="fw-bold">Account Temporarily Locked</h5>
              <p className="mb-2">
                Too many failed login attempts. Please try again after{' '}
                {Math.ceil((lockUntil - Date.now()) / 60000)} minutes.
              </p>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  setIsLocked(false);
                  setLoginAttempts(0);
                  localStorage.removeItem('adminLockData');
                }}
              >
                Reset Lock
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && !isLocked && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts > 0 && !isLocked && (
            <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
              <FiAlertCircle />
              <span>
                {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}. 
                {loginAttempts >= 3 && ' Account will be locked after 5 attempts.'}
              </span>
            </div>
          )}

          {/* Login Form */}
          {!isLocked && (
            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="form-group">
                <label className="form-label fw-semibold mb-2">Username</label>
                <div className="input-group">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-semibold">Password</label>
                  {/* <button
                    type="button"
                    className="forgot-link"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button> */}
                </div>
                <div className="input-group">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div>
                    <div className="security-indicator">
                      <div className={`security-fill ${getSecurityLevel()}`} />
                    </div>
                    <div className={`security-text ${getSecurityLevel()}`}>
                      {getSecurityLevel().replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication */}
              {showTwoFactor && (
                <div className="two-factor-card">
                  {/* <label className="form-label fw-semibold mb-2">
                    <FiFingerprint className="me-2" />
                    2FA Code
                  </label> */}
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength="6"
                  />
                  <small className="text-muted mt-2 d-block">
                    Enter the code from your authenticator app
                  </small>
                </div>
              )}

              {/* CAPTCHA */}
              {/* <div className="form-group">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="YOUR_RECAPTCHA_SITE_KEY" // Replace with your actual key
                  onChange={(token) => setCaptchaToken(token)}
                  theme="light"
                />
              </div> */}

              {/* Options */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                
                {/* <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowTwoFactor(!showTwoFactor)}
                >
                  {showTwoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                </button> */}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="login-btn mb-4"
                disabled={loading }
              >
                {loading ? (
                  <>
                    <div className="loading-spinner me-2"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <FiLogIn />
                    Secure Login
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="position-relative text-center my-4">
                <div className="border-top"></div>
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                  Or continue with
                </span>
              </div>

              {/* SSO Options */}
              <div className="row g-3 mb-4">
                {ssoProviders.map((provider) => (
                  <div key={provider.id} className="col-md-4">
                    <button
                      type="button"
                      className="sso-btn"
                      onClick={() => handleSSOLogin(provider.name)}
                      style={{ borderColor: provider.color }}
                    >
                      <span style={{ color: provider.color }}>{provider.icon}</span>
                      {provider.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Security Tips Toggle */}
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowSecurityTips(!showSecurityTips)}
                >
                  {showSecurityTips ? 'Hide' : 'Show'} Security Tips
                </button>
              </div>

              {/* Security Tips */}
              {showSecurityTips && (
                <div className="security-tips-card">
                  <h6 className="fw-bold mb-3">
                    <FiShield className="me-2" />
                    Security Best Practices
                  </h6>
                  <ul className="mb-0">
                    {securityTips.map((tip, index) => (
                      <li key={index} className="mb-2">
                        <FiCheckCircle className="me-2 text-success" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* IP Info */}
              {ipInfo && (
                <div className="ip-info">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <FiGlobe size={12} />
                    <small>Login from: {ipInfo.city}, {ipInfo.country_name}</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <FiSmartphone size={12} />
                    <small>IP: {ipInfo.ip}</small>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Footer */}
          <div className="text-center mt-4 pt-4 border-top">
            <p className="small text-muted mb-0">
              <FiAlertCircle className="me-1" />
              Unauthorized access is strictly prohibited
            </p>
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  );
}