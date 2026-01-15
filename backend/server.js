const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./utils/db');
const galleryRoutes = require('./routes/galleryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fileUpload = require('express-fileupload');

dotenv.config();
connectDB();

const app = express();

// Allow requests from frontend (update FRONTEND_URL in .env)
const FRONTEND = process.env.FRONTEND_URL;
app.use(cors({ origin: FRONTEND }));
app.use(express.json());

// File upload middleware (for Cloudinary uploads)
app.use(fileUpload({
  useTempFiles: true
}));

// Routes
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/youtube', require('./routes/youtubeRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/gallery', galleryRoutes);
app.use('/api/gita', require('./routes/gitaRoutes'));
 app.use('/api/admin', adminRoutes);

// Simple health check
app.get('/', (req, res) => res.send({ status: 'ok', timestamp: Date.now() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
