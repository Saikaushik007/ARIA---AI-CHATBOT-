require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'aria-super-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// API Routes
app.use('/api', chatRouter);

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`ARIA server running on http://localhost:${PORT}`);
});
