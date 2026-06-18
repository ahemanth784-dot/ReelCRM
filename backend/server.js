require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const path = require('path');
const fs = require('fs');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep the current single-server localhost workflow while Render serves API only.
const frontendDist = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/pipeline', require('./routes/pipeline'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found.' }));

if (process.env.NODE_ENV !== 'production' && fs.existsSync(frontendDist)) {
  app.use((req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ReelCRM Backend running on port ${PORT}`);
});
