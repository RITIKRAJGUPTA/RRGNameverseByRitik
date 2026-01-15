import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiHeart, FiGift, FiStar, FiAward, FiTrendingUp,
  FiDollarSign, FiCreditCard, FiLock, FiCheck,
  FiUsers, FiTarget, FiZap, FiCoffee, FiDownload,
  FiShare2, FiCopy, FiCalendar, FiBell, FiMail
} from 'react-icons/fi';
import { FaPaypal, FaGooglePay, FaAmazonPay, FaApplePay } from 'react-icons/fa';
import { SiRazorpay, SiStripe } from 'react-icons/si';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';

export default function Payment() {
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [donationType, setDonationType] = useState('one-time');
  const [loading, setLoading] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [supporters, setSupporters] = useState(42);
  const [showRewards, setShowRewards] = useState(false);
  const [monthlySubscription, setMonthlySubscription] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [theme, setTheme] = useState('light');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const containerRef = useRef(null);

  const presetAmounts = [10, 50, 100, 200, 500, 1000];
  const rewards = [
    { amount: 50, title: 'Coffee ☕', desc: 'Buy me a coffee!', icon: <FiCoffee /> },
    { amount: 100, title: 'Supporter 🌟', desc: 'Get a shoutout', icon: <FiStar /> },
    { amount: 200, title: 'Patron 🏆', desc: 'Early access to features', icon: <FiAward /> },
    { amount: 500, title: 'Sponsor 💎', desc: 'Priority support & mentions', icon: <FiTrendingUp /> }
  ];

  const paymentMethods = [
    { id: 'razorpay', name: 'Razorpay', icon: <SiRazorpay />, color: '#3399cc' },
    // { id: 'stripe', name: 'Stripe', icon: <SiStripe />, color: '#635bff' },
    // { id: 'paypal', name: 'PayPal', icon: <FaPaypal />, color: '#00457c' },
    // { id: 'googlepay', name: 'Google Pay', icon: <FaGooglePay />, color: '#5f6368' },
    // { id: 'amazonpay', name: 'Amazon Pay', icon: <FaAmazonPay />, color: '#ff9900' }
  ];

  useEffect(() => {
    // Load donation history from localStorage
    const savedHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];
    const savedTotal = parseInt(localStorage.getItem('totalRaised')) || 0;
    const savedSupporters = parseInt(localStorage.getItem('supporters')) || 42;
    
    setDonationHistory(savedHistory);
    setTotalRaised(savedTotal);
    setSupporters(savedSupporters);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSupporters(prev => {
          const newVal = prev + 1;
          localStorage.setItem('supporters', newVal.toString());
          return newVal;
        });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRazorpayScript = (src) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePresetAmount = (amt) => {
    setAmount(amt);
    setCustomAmount('');
    toast.info(`Amount set to ₹${amt}`, {
      position: 'bottom-right',
      autoClose: 1000
    });
  };

  const handleCustomAmount = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value && !isNaN(value)) {
      setAmount(parseInt(value));
    }
  };

  const validatePayment = () => {
    if (amount < 10) {
      toast.error('Minimum donation amount is ₹10', {
        position: 'top-center'
      });
      return false;
    }
    
    if (!userInfo.name.trim()) {
      toast.error('Please enter your name', {
        position: 'top-center'
      });
      return false;
    }
    
    if (!userInfo.email.trim() || !/\S+@\S+\.\S+/.test(userInfo.email)) {
      toast.error('Please enter a valid email', {
        position: 'top-center'
      });
      return false;
    }
    
    return true;
  };

  const processPayment = async () => {
    if (!validatePayment()) return;
    
    setLoading(true);
    
    toast.info('🚀 Initializing payment...', {
      position: 'top-center',
      autoClose: 2000,
    });

    try {
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      } else {
        // Simulate other payment methods
        toast.warning(`Payment via ${paymentMethod} is simulated in this demo`, {
          position: 'top-center'
        });
        
        setTimeout(() => {
          simulateSuccessfulPayment();
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.', {
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      toast.error('Payment SDK failed to load', {
        position: 'top-center'
      });
      return;
    }

    try {
      const { data } = await axios.post('https://rrgnameversebyritik.onrender.com/api/payment/create-order', { 
        amount: amount * 100,
        currency: 'INR',
        notes: {
          name: userInfo.name,
          email: userInfo.email,
          message: userInfo.message,
          type: donationType,
          monthly: monthlySubscription
        }
      });

      const options = {
        key: data.keyId,
        amount: data.amount.toString(),
        currency: data.currency,
        name: 'Support Ritik\'s Insight Hub',
        description: `Donation - ${donationType}${monthlySubscription ? ' (Monthly)' : ''}`,
        order_id: data.orderId,
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: '9999999999'
        },
        theme: {
          color: getThemeColor()
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled', {
              position: 'top-center'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Order creation error:', err);
      throw err;
    }
  };

  const simulateSuccessfulPayment = () => {
    const mockResponse = {
      razorpay_payment_id: 'pay_' + Math.random().toString(36).substr(2, 9),
      razorpay_order_id: 'order_' + Math.random().toString(36).substr(2, 9),
      razorpay_signature: 'sig_' + Math.random().toString(36).substr(2, 20)
    };
    
    handlePaymentSuccess(mockResponse);
  };

  const handlePaymentSuccess = async (response) => {
    // Celebrate with confetti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });

    const donationRecord = {
      id: response.razorpay_payment_id || Date.now(),
      amount,
      date: new Date().toISOString(),
      method: paymentMethod,
      type: donationType,
      monthly: monthlySubscription,
      name: userInfo.name,
      email: userInfo.email,
      message: userInfo.message
    };

    // Update state
    const newHistory = [donationRecord, ...donationHistory.slice(0, 9)];
    setDonationHistory(newHistory);
    setTotalRaised(prev => {
      const newTotal = prev + amount;
      localStorage.setItem('totalRaised', newTotal.toString());
      return newTotal;
    });
    setSupporters(prev => {
      const newSupporters = prev + 1;
      localStorage.setItem('supporters', newSupporters.toString());
      return newSupporters;
    });

    // Store in localStorage
    localStorage.setItem('donationHistory', JSON.stringify(newHistory));

    // Show success
    toast.success(
      <div>
        <h6>🎉 Thank You!</h6>
        <p>Your donation of ₹{amount} was successful!</p>
      </div>,
      {
        position: 'top-center',
        autoClose: 5000,
        closeButton: true
      }
    );

    // Generate invoice
    generateInvoice(donationRecord);

    // Reset form
    setAmount(50);
    setCustomAmount('');
    setUserInfo({ name: '', email: '', message: '' });

    // Send thank you email (simulated)
    sendThankYouEmail(donationRecord);
  };

  const generateInvoice = (donation) => {
    const invoice = {
      id: `INV-${Date.now()}`,
      ...donation,
      date: new Date(donation.date).toLocaleDateString('en-IN'),
      time: new Date(donation.date).toLocaleTimeString('en-IN'),
      tax: 0,
      total: donation.amount
    };
    
    setInvoiceData(invoice);
    setShowInvoice(true);
    
    toast.info('📄 Invoice generated!', {
      position: 'bottom-right'
    });
  };

  const downloadInvoice = async () => {
    if (!invoiceData) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(74, 108, 247);
    doc.rect(0, 0, 210, 60, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('Thank You!', 105, 30, null, null, 'center');
    doc.setFontSize(16);
    doc.text('Donation Invoice', 105, 40, null, null, 'center');
    
    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    doc.text(`Invoice ID: ${invoiceData.id}`, 20, 80);
    doc.text(`Date: ${invoiceData.date}`, 20, 90);
    doc.text(`Time: ${invoiceData.time}`, 20, 100);
    doc.text(`Donor: ${invoiceData.name}`, 20, 110);
    doc.text(`Email: ${invoiceData.email}`, 20, 120);
    
    // Amount
    doc.setFontSize(20);
    doc.setTextColor(74, 108, 247);
    doc.text(`₹${invoiceData.amount}`, 160, 80);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Donation Amount', 160, 90);
    
    // Message
    if (invoiceData.message) {
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text('Message:', 20, 140);
      const splitMsg = doc.splitTextToSize(invoiceData.message, 170);
      doc.text(splitMsg, 20, 150);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for supporting Ritik\'s Insight Hub!', 105, 280, null, null, 'center');
    doc.text('This donation helps maintain and improve the platform.', 105, 285, null, null, 'center');
    
    doc.save(`Invoice_${invoiceData.id}.pdf`);
  };

  const sendThankYouEmail = (donation) => {
    // Simulate sending email
    console.log('Sending thank you email to:', donation.email);
    
    toast.info('📧 Thank you email sent!', {
      position: 'bottom-right',
      autoClose: 3000
    });
  };

  const shareDonation = () => {
    const text = `I just supported Ritik's Insight Hub with ₹${amount}! Join me in supporting this amazing project!`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'I just made a donation!',
        text: text,
        url: url
      });
    } else {
      navigator.clipboard.writeText(`${text}\n\n${url}`);
      toast.info('Donation message copied to clipboard!', {
        position: 'bottom-right'
      });
    }
  };

  const getProgressPercentage = () => {
    return Math.min((totalRaised / goal) * 100, 100);
  };

  const getThemeColor = () => {
    const themes = {
      light: '#4a6cf7',
      dark: '#6366f1',
      premium: '#8b5cf6'
    };
    return themes[theme] || '#4a6cf7';
  };

  const themes = {
    light: { bg: '#ffffff', card: '#f8f9fa', text: '#212529', accent: '#4a6cf7' },
    dark: { bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', accent: '#6366f1' },
    premium: { bg: '#f0f4ff', card: '#ffffff', text: '#1e293b', accent: '#8b5cf6' }
  };

  const currentTheme = themes[theme];

  return (
    <>
      <style>
        {`
          .payment-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            min-height: 100vh;
            transition: all 0.3s ease;
          }
          
          .hero-section {
            background: linear-gradient(135deg, ${currentTheme.accent} 0%, #3b82f6 100%);
            padding: 60px 0;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
          }
          
          .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="rgba(255,255,255,0.1)" d="M30,30 Q50,10 70,30 T90,50 T70,70 T50,90 T30,70 T10,50 T30,30 Z"/></svg>') repeat;
            opacity: 0.2;
          }
          
          .donation-card {
            background: ${currentTheme.card};
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          
          .donation-card:hover {
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12);
          }
          
          .amount-btn {
            padding: 15px 25px;
            border-radius: 12px;
            background: rgba(74, 108, 247, 0.1);
            border: 2px solid rgba(74, 108, 247, 0.2);
            color: ${currentTheme.accent};
            font-weight: 600;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .amount-btn:hover {
            background: rgba(74, 108, 247, 0.2);
            transform: translateY(-3px);
          }
          
          .amount-btn.selected {
            background: ${currentTheme.accent};
            color: white;
            border-color: ${currentTheme.accent};
            box-shadow: 0 5px 15px rgba(74, 108, 247, 0.3);
          }
          
          .custom-amount-input {
            padding: 18px 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            font-size: 1.2rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            width: 100%;
          }
          
          .custom-amount-input:focus {
            outline: none;
            border-color: ${currentTheme.accent};
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.1);
            transform: translateY(-2px);
          }
          
          .payment-method-btn {
            padding: 15px;
            border-radius: 12px;
            background: ${currentTheme.card};
            border: 2px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .payment-method-btn:hover {
            transform: translateY(-3px);
            border-color: ${currentTheme.accent};
          }
          
          .payment-method-btn.selected {
            border-color: ${currentTheme.accent};
            background: rgba(74, 108, 247, 0.05);
            box-shadow: 0 5px 15px rgba(74, 108, 247, 0.1);
          }
          
          .donate-btn {
            background: linear-gradient(135deg, ${currentTheme.accent} 0%, #3b82f6 100%);
            border: none;
            padding: 20px 50px;
            border-radius: 15px;
            color: white;
            font-weight: 600;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            position: relative;
            overflow: hidden;
          }
          
          .donate-btn:hover:not(:disabled) {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(74, 108, 247, 0.3);
          }
          
          .donate-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .donate-btn::after {
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
          
          .donate-btn:hover::after {
            left: 100%;
          }
          
          .stats-card {
            background: linear-gradient(135deg, ${currentTheme.accent}, #3b82f6);
            color: white;
            padding: 25px;
            border-radius: 16px;
            text-align: center;
          }
          
          .progress-bar {
            height: 12px;
            background: #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            margin: 20px 0;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #34d399);
            border-radius: 6px;
            transition: width 1s ease;
          }
          
          .reward-card {
            background: ${currentTheme.card};
            border-radius: 16px;
            padding: 25px;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .reward-card:hover {
            border-color: ${currentTheme.accent};
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          
          .reward-card.selected {
            border-color: ${currentTheme.accent};
            background: rgba(74, 108, 247, 0.05);
            box-shadow: 0 10px 30px rgba(74, 108, 247, 0.15);
          }
          
          .invoice-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
          }
          
          .invoice-content {
            background: ${currentTheme.card};
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .history-item {
            padding: 15px;
            border-radius: 12px;
            background: ${currentTheme.card};
            margin-bottom: 10px;
            border-left: 4px solid ${currentTheme.accent};
          }
          
          .user-input {
            padding: 15px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            transition: all 0.3s ease;
            width: 100%;
          }
          
          .user-input:focus {
            outline: none;
            border-color: ${currentTheme.accent};
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.1);
          }
          
          .type-toggle {
            display: flex;
            background: ${currentTheme.card};
            padding: 5px;
            border-radius: 12px;
          }
          
          .type-btn {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: ${currentTheme.text};
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .type-btn.active {
            background: ${currentTheme.accent};
            color: white;
          }
          
          .subscription-badge {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .pulse {
            animation: pulse 2s infinite;
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
        `}
      </style>

      <div className="payment-container" ref={containerRef} style={{ paddingTop: '80px' }}>
        <ToastContainer />
        
        {/* Hero Section */}
        <div className="hero-section">
          <div className="container">
            <div className="text-center text-white">
              <h1 className="display-4 fw-bold mb-3">
                <FiHeart className="me-3" />
                Support the Developer
              </h1>
              <p className="fs-5 opacity-90 mb-4">
                Your contribution helps maintain and improve Ritik's Insight Hub
              </p>
              
              {/* Stats */}
              <div className="row justify-content-center mb-4">
                <div className="col-md-8">
                  <div className="stats-card">
                    <div className="row">
                      <div className="col-4">
                        <h2 className="display-5 fw-bold">₹{totalRaised}</h2>
                        <small>Total Raised</small>
                      </div>
                      <div className="col-4">
                        <h2 className="display-5 fw-bold">{supporters}</h2>
                        <small>Supporters</small>
                      </div>
                      <div className="col-4">
                        <h2 className="display-5 fw-bold">{getProgressPercentage().toFixed(0)}%</h2>
                        <small>Goal Progress</small>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="d-flex justify-content-between mb-2">
                        <small>₹0</small>
                        <small>Goal: ₹{goal.toLocaleString()}</small>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getProgressPercentage()}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-4">
          <div className="row">
            {/* Left Column - Donation Form */}
            <div className="col-lg-8">
              <div className="donation-card mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="fw-bold mb-0">Make a Donation</h2>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    >
                      Theme
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowRewards(!showRewards)}
                    >
                      {showRewards ? 'Hide Rewards' : 'Show Rewards'}
                    </button>
                  </div>
                </div>

                {/* Donation Type */}
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3">Donation Type</h5>
                  <div className="type-toggle mb-3">
                    <button
                      className={`type-btn ${donationType === 'one-time' ? 'active' : ''}`}
                      onClick={() => setDonationType('one-time')}
                    >
                      One-time
                    </button>
                    <button
                      className={`type-btn ${donationType === 'monthly' ? 'active' : ''}`}
                      onClick={() => setDonationType('monthly')}
                    >
                      Monthly
                    </button>
                  </div>
                  
                  {donationType === 'monthly' && (
                    <div className="alert alert-info d-flex align-items-center gap-2">
                      <FiBell />
                      <span className="small">You'll be charged ₹{amount} every month</span>
                    </div>
                  )}
                </div>

                {/* Amount Selection */}
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3">Select Amount</h5>
                  <div className="row g-2 mb-3">
                    {presetAmounts.map((amt) => (
                      <div key={amt} className="col-4 col-md-2">
                        <button
                          className={`amount-btn w-100 ${amount === amt ? 'selected' : ''}`}
                          onClick={() => handlePresetAmount(amt)}
                        >
                          ₹{amt}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-3">
                    <input
                      type="number"
                      className="custom-amount-input"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={handleCustomAmount}
                      min="10"
                      max="100000"
                    />
                    <small className="text-muted d-block mt-2">Minimum: ₹10</small>
                  </div>
                </div>

                {/* User Information */}
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3">Your Information</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="user-input"
                        placeholder="Your Name"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="email"
                        className="user-input"
                        placeholder="Email Address"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                      />
                    </div>
                    <div className="col-12">
                      <textarea
                        className="user-input"
                        placeholder="Optional: Add a message of support"
                        rows="3"
                        value={userInfo.message}
                        onChange={(e) => setUserInfo({...userInfo, message: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3">Payment Method</h5>
                  <div className="row g-2">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="col-6 col-md-4">
                        <div
                          className={`payment-method-btn ${paymentMethod === method.id ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod(method.id)}
                          style={{ borderColor: paymentMethod === method.id ? method.color : '' }}
                        >
                          <div className="mb-2" style={{ fontSize: '24px', color: method.color }}>
                            {method.icon}
                          </div>
                          <small>{method.name}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security & Features */}
                <div className="mb-4">
                  <div className="d-flex flex-wrap gap-3 justify-content-center">
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <FiLock size={14} />
                      <small>Secure Payment</small>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <FiCheck size={14} />
                      <small>SSL Encrypted</small>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <FiDownload size={14} />
                      <small>Instant Receipt</small>
                    </div>
                  </div>
                </div>

                {/* Donate Button */}
                <button
                  className="donate-btn"
                  onClick={processPayment}
                  disabled={loading || amount < 10}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner me-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiHeart />
                      {donationType === 'monthly' ? 'Subscribe Monthly' : 'Donate Now'} ₹{amount}
                    </>
                  )}
                </button>
              </div>

              {/* Rewards Section */}
              {showRewards && (
                <div className="donation-card">
                  <h4 className="fw-bold mb-4">Donation Rewards</h4>
                  <div className="row g-4">
                    {rewards.map((reward) => (
                      <div key={reward.amount} className="col-md-6">
                        <div 
                          className={`reward-card ${amount >= reward.amount ? 'selected' : ''}`}
                          onClick={() => handlePresetAmount(reward.amount)}
                        >
                          <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{ fontSize: '24px', color: currentTheme.accent }}>
                              {reward.icon}
                            </div>
                            <div>
                              <h5 className="fw-bold mb-1">{reward.title}</h5>
                              <h4 className="fw-bold" style={{ color: currentTheme.accent }}>
                                ₹{reward.amount}
                              </h4>
                            </div>
                          </div>
                          <p className="text-muted mb-0">{reward.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Recent Donations & Info */}
            <div className="col-lg-4">
              {/* Recent Donations */}
              <div className="donation-card mb-4">
                <h4 className="fw-bold mb-4">Recent Donations</h4>
                {donationHistory.length > 0 ? (
                  <div>
                    {donationHistory.slice(0, 5).map((donation) => (
                      <div key={donation.id} className="history-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{donation.name || 'Anonymous'}</strong>
                            <p className="mb-1 text-muted small">{donation.message?.substring(0, 50)}</p>
                          </div>
                          <div className="text-end">
                            <h5 className="fw-bold" style={{ color: currentTheme.accent }}>
                              ₹{donation.amount}
                            </h5>
                            <small className="text-muted">
                              {new Date(donation.date).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FiHeart size={48} className="mb-3" style={{ color: currentTheme.accent, opacity: 0.3 }} />
                    <p className="text-muted">Be the first to donate!</p>
                  </div>
                )}
              </div>

              {/* Features & Benefits */}
              <div className="donation-card">
                <h4 className="fw-bold mb-4">Where Your Money Goes</h4>
                <div className="d-flex flex-column gap-3">
                  {[
                    { icon: <FiZap />, text: 'Server hosting and maintenance' },
                    { icon: <FiCoffee />, text: 'New features and updates' },
                    { icon: <FiUsers />, text: 'Community support and engagement' },
                    { icon: <FiTarget />, text: 'Future development plans' }
                  ].map((item, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3">
                      <div style={{ color: currentTheme.accent }}>
                        {item.icon}
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-top">
                  <button
                    className="btn btn-outline-primary w-100 mb-2"
                    onClick={shareDonation}
                  >
                    <FiShare2 className="me-2" />
                    Share This Page
                  </button>
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => window.open('mailto:ritikrajgupta2001@gmail.com')}
                  >
                    <FiMail className="me-2" />
                    Contact for Sponsorship
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <div className="invoice-modal">
          <div className="invoice-content">
            <div className="text-center mb-4">
              <h3 className="fw-bold mb-2">🎉 Donation Successful!</h3>
              <p className="text-muted">Thank you for your generous contribution</p>
            </div>
            
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold">Invoice #{invoiceData.id}</h5>
                <h3 className="fw-bold" style={{ color: currentTheme.accent }}>
                  ₹{invoiceData.amount}
                </h3>
              </div>
              
              <div className="row mb-3">
                <div className="col-6">
                  <small className="text-muted">Date</small>
                  <p className="mb-0">{invoiceData.date}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">Time</small>
                  <p className="mb-0">{invoiceData.time}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <small className="text-muted">Donor</small>
                <p className="mb-0">{invoiceData.name}</p>
                <p className="text-muted small">{invoiceData.email}</p>
              </div>
              
              {invoiceData.message && (
                <div className="mb-4">
                  <small className="text-muted">Message</small>
                  <p className="mb-0">{invoiceData.message}</p>
                </div>
              )}
            </div>
            
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary flex-grow-1"
                onClick={downloadInvoice}
              >
                <FiDownload className="me-2" />
                Download Invoice
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowInvoice(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}