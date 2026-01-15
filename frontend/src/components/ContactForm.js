import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FiSend, FiUser, FiMail, FiPhone, FiMessageSquare, 
  FiMapPin, FiClock, FiCheck, FiAlertCircle, FiPaperclip,
  FiDownload, FiShare2, FiCopy, FiSave, FiCalendar
} from "react-icons/fi";
import { FaLinkedin, FaGithub, FaTwitter, FaWhatsapp } from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    watch
  } = useForm({
    mode: "onChange"
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [formStatus, setFormStatus] = useState("idle"); // idle, submitting, success, error
  const [attachment, setAttachment] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [theme, setTheme] = useState("light");
  const [characterCount, setCharacterCount] = useState(0);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const recaptchaRef = useRef(null);

  const contactMethods = [
    {
      icon: <FiMail />,
      title: "Email",
      value: "ritikrajgupta2001@gmail.com",
      action: () => window.open("mailto:ritikrajgupta2001@gmail.com")
    },
    {
      icon: <FiPhone />,
      title: "Phone",
      value: "+91 9816950136",
      action: () => window.open("tel:+91 9816950136")
    },
    {
      icon: <FiMapPin />,
      title: "Location",
      value: "Nalagarh",
      action: () => window.open("https://www.google.com/maps/place/Nalagarh,+Himachal+Pradesh+174101/@31.0377836,76.7076088,14z/data=!3m1!4b1!4m6!3m5!1s0x39055bed10b3b4cd:0xde7f92cf6bf32e51!8m2!3d31.0460685!4d76.7025709!16zL20vMDd5eHRs?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D")
    },
    {
      icon: <FiClock />,
      title: "Response Time",
      value: "Within 24 hours",
      action: null
    }
  ];

  const socialLinks = [
    { icon: <FaLinkedin />, url: "https://www.linkedin.com/in/rrgritik2001/", color: "#0077b5" },
    { icon: <FaGithub />, url: "https://github.com/RITIKRAJGUPTA", color: "#333" }
  ];

  // Auto-save draft
  const saveDraft = () => {
    const formData = watch();
    const draft = {
      ...formData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      attachment: attachment?.name
    };
    
    const updatedDrafts = [draft, ...savedDrafts.slice(0, 4)];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem("contactDrafts", JSON.stringify(updatedDrafts));
    toast.info("Draft saved automatically", { position: "bottom-right" });
  };

  // Load draft from localStorage on mount
  React.useEffect(() => {
    const drafts = JSON.parse(localStorage.getItem("contactDrafts")) || [];
    setSavedDrafts(drafts);
  }, []);

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave) return;
    
    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (formData.name || formData.email || formData.message) {
        saveDraft();
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearTimeout(timeoutId);
  }, [watch(), autoSave]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB", { position: "top-right" });
      return;
    }

    setAttachment(file);
    toast.success(`File "${file.name}" attached`, { position: "top-right" });
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data) => {
   
    setFormStatus("submitting");
    
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      formData.append("captchaToken", captchaToken);
      if (attachment) {
        formData.append("attachment", attachment);
      }

      await axios.post("http://localhost:5000/api/contact/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setFormStatus("success");
      setContactInfo(data);
      
      // Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success("🎉 Message sent successfully!", {
        position: "top-right",
        autoClose: 5000,
      });

      // Reset form
      reset();
      setAttachment(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaToken(null);

      // Remove used draft if any
      if (savedDrafts.length > 0) {
        const updatedDrafts = savedDrafts.slice(1);
        setSavedDrafts(updatedDrafts);
        localStorage.setItem("contactDrafts", JSON.stringify(updatedDrafts));
      }

      // Clear auto-save after 5 seconds
      setTimeout(() => setFormStatus("idle"), 5000);

    } catch (err) {
      setFormStatus("error");
      console.error("Submission error:", err);
      
      const errorMessage = err.response?.data?.message || "Failed to send message.";
      toast.error(`❌ ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
      
      setTimeout(() => setFormStatus("idle"), 3000);
    }
  };

  const downloadFormData = async () => {
    if (!formRef.current) return;

    const canvas = await html2canvas(formRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.setFillColor(74, 108, 247);
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Contact Form Submission', 105, 25, null, null, 'center');
    
    pdf.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 280, null, null, 'center');
    
    pdf.save(`Contact_Form_${Date.now()}.pdf`);
  };

  const copyFormData = () => {
    const formData = watch();
    const text = `Contact Form Data:\n\nName: ${formData.name || 'Not provided'}\nEmail: ${formData.email || 'Not provided'}\nPhone: ${formData.phone || 'Not provided'}\nMessage: ${formData.message || 'Not provided'}`;
    
    navigator.clipboard.writeText(text);
    toast.info("Form data copied to clipboard", { position: "bottom-right" });
  };

  const loadDraft = (draft) => {
    reset({
      name: draft.name || "",
      email: draft.email || "",
      phone: draft.phone || "",
      message: draft.message || ""
    });
    toast.success("Draft loaded", { position: "top-right" });
  };

  const deleteDraft = (draftId) => {
    const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem("contactDrafts", JSON.stringify(updatedDrafts));
    toast.info("Draft deleted", { position: "bottom-right" });
  };

  const shareContact = () => {
    const formData = watch();
    const shareText = `I'm reaching out via Ritik's Contact Form:\n\nName: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message?.substring(0, 100)}...`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Contact Form',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.info("Contact info copied to clipboard", { position: "bottom-right" });
    }
  };

  const themes = {
    light: { bg: "#ffffff", card: "#f8f9fa", text: "#212529", accent: "#4a6cf7" },
    dark: { bg: "#0f172a", card: "#1e293b", text: "#f1f5f9", accent: "#6366f1" },
    modern: { bg: "#f0f4ff", card: "#ffffff", text: "#1e293b", accent: "#7c3aed" }
  };

  const currentTheme = themes[theme];

  return (
    <>
      <style>
        {`
          .contact-container {
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            min-height: 100vh;
            transition: all 0.3s ease;
          }
          
          .contact-header {
            background: linear-gradient(135deg, ${currentTheme.accent} 0%, #3b82f6 100%);
            padding: 60px 0;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
          }
          
          .contact-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="rgba(255,255,255,0.1)" d="M30,30 Q50,10 70,30 T90,50 T70,70 T50,90 T30,70 T10,50 T30,30 Z"/></svg>') repeat;
            opacity: 0.2;
          }
          
          .form-card {
            background: ${currentTheme.card};
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          
          .form-card:hover {
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12);
          }
          
          .form-input {
            padding: 16px 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: ${currentTheme.bg};
            color: ${currentTheme.text};
            font-size: 1rem;
            transition: all 0.3s ease;
            width: 100%;
          }
          
          .form-input:focus {
            outline: none;
            border-color: ${currentTheme.accent};
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.1);
            transform: translateY(-2px);
          }
          
          .form-input.error {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.05);
          }
          
          .form-input.success {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.05);
          }
          
          .form-label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-weight: 600;
            color: ${currentTheme.text};
          }
          
          .submit-btn {
            background: linear-gradient(135deg, ${currentTheme.accent} 0%, #3b82f6 100%);
            border: none;
            padding: 18px 40px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(74, 108, 247, 0.3);
          }
          
          .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .submit-btn::after {
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
          
          .submit-btn:hover::after {
            left: 100%;
          }
          
          .contact-method-card {
            background: ${currentTheme.card};
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(0, 0, 0, 0.05);
            cursor: pointer;
          }
          
          .contact-method-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border-color: ${currentTheme.accent};
          }
          
          .social-link {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .social-link:hover {
            transform: translateY(-5px) scale(1.1);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }
          
          .attachment-card {
            background: rgba(74, 108, 247, 0.05);
            border: 2px dashed rgba(74, 108, 247, 0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .attachment-card:hover {
            background: rgba(74, 108, 247, 0.1);
            border-color: ${currentTheme.accent};
          }
          
          .draft-card {
            background: ${currentTheme.card};
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid ${currentTheme.accent};
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .draft-card:hover {
            transform: translateX(5px);
            background: rgba(74, 108, 247, 0.05);
          }
          
          .preview-card {
            background: ${currentTheme.card};
            border-radius: 16px;
            padding: 30px;
            border: 2px solid ${currentTheme.accent};
          }
          
          .character-counter {
            text-align: right;
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 5px;
          }
          
          .character-counter.warning {
            color: #f59e0b;
          }
          
          .character-counter.error {
            color: #ef4444;
          }
          
          .form-status {
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 600;
          }
          
          .form-status.submitting {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 2px solid rgba(59, 130, 246, 0.2);
          }
          
          .form-status.success {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 2px solid rgba(16, 185, 129, 0.2);
            animation: pulse 2s infinite;
          }
          
          .form-status.error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 2px solid rgba(239, 68, 68, 0.2);
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          .slide-in {
            animation: slideIn 0.5s ease-out;
          }
          
          .control-btn {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${currentTheme.card};
            border: 2px solid rgba(0, 0, 0, 0.1);
            color: ${currentTheme.text};
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .control-btn:hover {
            background: ${currentTheme.accent};
            color: white;
            transform: translateY(-3px);
          }
        `}
      </style>

      <div className="contact-container" style={{ paddingTop: '80px' }}>
        <ToastContainer />
        
        {/* Header */}
        <div className="contact-header">
          <div className="container">
            <div className="text-center text-white">
              <h1 className="display-4 fw-bold mb-3">Get In Touch</h1>
              <p className="fs-5 opacity-90">
                Have questions? I'd love to hear from you. Send me a message and I'll respond as soon as possible.
              </p>
            </div>
          </div>
        </div>

        <div className="container py-4">
          <div className="row">
            {/* Left Column - Contact Methods */}
            <div className="col-lg-4 mb-4">
              <div className="sticky-top" style={{ top: '100px' }}>
                {/* Contact Methods */}
                <div className="form-card mb-4">
                  <h4 className="fw-bold mb-4">Contact Methods</h4>
                  <div className="row g-3">
                    {contactMethods.map((method, index) => (
                      <div key={index} className="col-12" onClick={method.action}>
                        <div className="contact-method-card">
                          <div className="mb-2" style={{ color: currentTheme.accent }}>
                            {method.icon}
                          </div>
                          <h6 className="fw-semibold">{method.title}</h6>
                          <p className="mb-0 text-muted">{method.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="form-card">
                  <h4 className="fw-bold mb-4">Connect With Me</h4>
                  <div className="d-flex justify-content-center gap-3">
                    {socialLinks.map((social, index) => (
                      <div
                        key={index}
                        className="social-link"
                        style={{ background: social.color }}
                        onClick={() => window.open(social.url, '_blank')}
                      >
                        {social.icon}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drafts Panel */}
                {savedDrafts.length > 0 && (
                  <div className="form-card mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Saved Drafts</h6>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowDrafts(!showDrafts)}
                      >
                        {showDrafts ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    
                    {showDrafts && (
                      <div className="slide-in">
                        {savedDrafts.map((draft) => (
                          <div key={draft.id} className="draft-card">
                            <div className="d-flex justify-content-between align-items-start">
                              <div onClick={() => loadDraft(draft)}>
                                <small className="text-muted">
                                  {new Date(draft.timestamp).toLocaleDateString()}
                                </small>
                                <p className="mb-1 text-truncate">{draft.message?.substring(0, 50) || 'Empty draft'}...</p>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDraft(draft.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="col-lg-8">
              <div ref={formRef}>
                <div className="form-card slide-in">
                  {/* Form Status */}
                  {formStatus !== 'idle' && (
                    <div className={`form-status ${formStatus}`}>
                      {formStatus === 'submitting' && '⏳ Sending your message...'}
                      {formStatus === 'success' && '✅ Message sent successfully!'}
                      {formStatus === 'error' && '❌ Failed to send message.'}
                    </div>
                  )}

                  {/* Form Controls */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold mb-0">Send Message</h2>
                    <div className="d-flex gap-2">
                      <button
                        className="control-btn"
                        onClick={copyFormData}
                        title="Copy form data"
                      >
                        <FiCopy />
                      </button>
                      <button
                        className="control-btn"
                        onClick={downloadFormData}
                        title="Download as PDF"
                      >
                        <FiDownload />
                      </button>
                      <button
                        className="control-btn"
                        onClick={shareContact}
                        title="Share contact"
                      >
                        <FiShare2 />
                      </button>
                    </div>
                  </div>

                  {/* Form Preview Toggle */}
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                        id="autoSaveToggle"
                      />
                      <label className="form-check-label" htmlFor="autoSaveToggle">
                        Auto-save drafts
                      </label>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={showPreview}
                        onChange={(e) => setShowPreview(e.target.checked)}
                        id="previewToggle"
                      />
                      <label className="form-check-label" htmlFor="previewToggle">
                        Show preview
                      </label>
                    </div>
                  </div>

                  {/* Preview */}
                  {showPreview && (
                    <div className="preview-card mb-4 slide-in">
                      <h5 className="fw-bold mb-3">Form Preview</h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Name:</strong> {watch('name') || 'Not provided'}</p>
                          <p><strong>Email:</strong> {watch('email') || 'Not provided'}</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Phone:</strong> {watch('phone') || 'Not provided'}</p>
                          <p><strong>Message:</strong> {watch('message')?.substring(0, 100) || 'Not provided'}...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Form */}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="row">
                      {/* Name Field */}
                      <div className="col-md-6 mb-4">
                        <label className="form-label">
                          <FiUser />
                          Full Name
                        </label>
                        <input
                          className={`form-input ${errors.name ? 'error' : watch('name') ? 'success' : ''}`}
                          placeholder="John Doe"
                          {...register("name", { 
                            required: "Name is required",
                            minLength: { value: 2, message: "Name must be at least 2 characters" }
                          })}
                        />
                        {errors.name ? (
                          <div className="d-flex align-items-center gap-1 mt-2 text-danger">
                            <FiAlertCircle size={14} />
                            <small>{errors.name.message}</small>
                          </div>
                        ) : watch('name') && (
                          <div className="d-flex align-items-center gap-1 mt-2 text-success">
                            <FiCheck size={14} />
                            <small>Looks good!</small>
                          </div>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="col-md-6 mb-4">
                        <label className="form-label">
                          <FiMail />
                          Email Address
                        </label>
                        <input
                          className={`form-input ${errors.email ? 'error' : watch('email') ? 'success' : ''}`}
                          placeholder="john@example.com"
                          type="email"
                          {...register("email", {
                            required: "Email is required",
                            pattern: { 
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address"
                            }
                          })}
                        />
                        {errors.email ? (
                          <div className="d-flex align-items-center gap-1 mt-2 text-danger">
                            <FiAlertCircle size={14} />
                            <small>{errors.email.message}</small>
                          </div>
                        ) : watch('email') && (
                          <div className="d-flex align-items-center gap-1 mt-2 text-success">
                            <FiCheck size={14} />
                            <small>Valid email!</small>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phone Field */}
                    <div className="mb-4">
                      <label className="form-label">
                        <FiPhone />
                        Phone Number
                      </label>
                      <input
                        className={`form-input ${errors.phone ? 'error' : watch('phone') ? 'success' : ''}`}
                        placeholder="(123) 456-7890"
                        {...register("phone", {
                          pattern: {
                            value: /^[\+]?[1-9][\d]{0,15}$/,
                            message: "Invalid phone number"
                          }
                        })}
                      />
                      {errors.phone && (
                        <div className="d-flex align-items-center gap-1 mt-2 text-danger">
                          <FiAlertCircle size={14} />
                          <small>{errors.phone.message}</small>
                        </div>
                      )}
                    </div>

                    {/* Message Field */}
                    <div className="mb-4">
                      <label className="form-label">
                        <FiMessageSquare />
                        Your Message
                      </label>
                      <textarea
                        className={`form-input ${errors.message ? 'error' : ''}`}
                        placeholder="Type your message here..."
                        rows="6"
                        {...register("message", {
                          required: "Message is required",
                          minLength: {
                            value: 10,
                            message: "Message must be at least 10 characters"
                          },
                          maxLength: {
                            value: 1000,
                            message: "Message cannot exceed 1000 characters"
                          },
                          onChange: (e) => setCharacterCount(e.target.value.length)
                        })}
                      />
                      <div className={`character-counter ${characterCount > 950 ? 'error' : characterCount > 800 ? 'warning' : ''}`}>
                        {characterCount} / 1000 characters
                      </div>
                      {errors.message && (
                        <div className="d-flex align-items-center gap-1 mt-2 text-danger">
                          <FiAlertCircle size={14} />
                          <small>{errors.message.message}</small>
                        </div>
                      )}
                    </div>

                   

                    {/* Submit Button */}
                    <div className="d-flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting || formStatus === 'submitting'}
                      >
                        {isSubmitting || formStatus === 'submitting' ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FiSend />
                            Send Message
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => reset()}
                        disabled={isSubmitting}
                      >
                        Clear Form
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={saveDraft}
                        disabled={isSubmitting}
                      >
                        <FiSave className="me-2" />
                        Save Draft
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}