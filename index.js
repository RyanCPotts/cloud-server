/**
 * Cloud Server - Main Application Entry Point
 * 
 * This file serves as the main entry point for the cloud server application.
 * It initializes the Express server, sets up middleware, defines routes,
 * and starts listening for requests.
 */

// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();

// Define port to use
const PORT = process.env.PORT || 3000;

// Setup middleware
// Request logging
app.use(morgan('dev'));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Compress responses
app.use(compression());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define basic routes

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API server stats route
app.get('/api/stats', (req, res) => {
  const stats = {
    cpu: {
      usage: Math.floor(Math.random() * 100) // Mock data - replace with actual CPU monitoring
    },
    memory: {
      total: Math.floor(require('os').totalmem() / 1024 / 1024),
      free: Math.floor(require('os').freemem() / 1024 / 1024),
      usage: Math.floor((1 - require('os').freemem() / require('os').totalmem()) * 100)
    },
    disk: {
      // Mock data - replace with actual disk monitoring
      total: 500,
      used: Math.floor(Math.random() * 200 + 100),
      free: Math.floor(Math.random() * 200 + 100)
    },
    network: {
      // Mock data - replace with actual network monitoring
      traffic: (Math.random() * 10).toFixed(1)
    },
    uptime: {
      server: formatUptime(process.uptime()),
      system: formatUptime(require('os').uptime())
    }
  };
  
  res.json(stats);
});

// Server control endpoints
// Note: These are mock implementations. In a real application,
// you would implement actual server control logic.

// Start server
app.post('/api/control/start', (req, res) => {
  // Add authentication and authorization checks here
  
  // Mock implementation
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: 'Server started successfully',
      timestamp: new Date()
    });
  }, 1000);
});

// Stop server
app.post('/api/control/stop', (req, res) => {
  // Add authentication and authorization checks here
  
  // Mock implementation
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: 'Server stopped successfully',
      timestamp: new Date()
    });
  }, 1000);
});

// Restart server
app.post('/api/control/restart', (req, res) => {
  // Add authentication and authorization checks here
  
  // Mock implementation
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: 'Server restarted successfully',
      timestamp: new Date()
    });
  }, 2000);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

// 404 handler - keep this as the last route
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at ${req.path} was not found`
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});

/**
 * Format uptime in a human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days} day${days > 1 ? 's' : ''}, `;
  if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''}, `;
  result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  return result;
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  // Close database connections, finish processing requests, etc.
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  // Close database connections, finish processing requests, etc.
  process.exit(0);
});

module.exports = app; // Export for testing purposes
