import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
import AdminUpload from './components/AdminUpload';

const NameMeaning = lazy(() => import('./components/NameMeaning'));
const RockPaperScissors = lazy(() => import('./components/RockPaperScissors'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const YoutubeSearch = lazy(() => import('./components/YoutubeSearch'));
const Payment = lazy(() => import('./components/Payment'));
const Gallery = lazy(() => import('./components/Gallery'));

function App() {
  const [adminToken, setAdminToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setAdminToken(token);
  }, []);

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <Suspense fallback={<div className="text-center mt-5">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin-login" element={<AdminLogin onLogin={setAdminToken} />} />
            <Route
              path="/admin-upload"
              element={adminToken ? <AdminUpload token={adminToken} onLogout={handleLogout} /> : <AdminLogin onLogin={setAdminToken} />}
            />
            <Route path="/name" element={<NameMeaning />} />
            <Route path="/game" element={<RockPaperScissors />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/search" element={<YoutubeSearch />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/gallery" element={<Gallery />} />
            
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
