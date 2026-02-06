// lib/logger.js
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create rotating streams (max 10MB per file, keep 10 rotated files)
// Auto-rotates and deletes old files automatically
const appStream = rfs.createStream('app.log', {
  size: '10M',
  interval: '1d',
  compress: 'gzip', // Compress rotated files to save space
  path: LOG_DIR,
  maxFiles: 10 // Automatically deletes oldest files beyond this limit
});

const errorStream = rfs.createStream('error.log', {
  size: '10M',
  interval: '1d',
  compress: 'gzip',
  path: LOG_DIR,
  maxFiles: 10
});

const userActionStream = rfs.createStream('user-actions.log', {
  size: '10M',
  interval: '1d',
  compress: 'gzip',
  path: LOG_DIR,
  maxFiles: 10
});

function formatLog(level, category, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    category,
    message,
    ...meta
  };
  return JSON.stringify(logEntry) + '\n';
}

const logger = {
  // General info logs
  info: (category, message, meta = {}) => {
    const log = formatLog('INFO', category, message, meta);
    appStream.write(log);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] [${category}]`, message, meta);
    }
  },

  // Error logs
  error: (category, message, error = null, meta = {}) => {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    const log = formatLog('ERROR', category, message, errorMeta);
    errorStream.write(log);
    appStream.write(log);
    console.error(`[ERROR] [${category}]`, message, error, meta);
  },

  // Warning logs
  warn: (category, message, meta = {}) => {
    const log = formatLog('WARN', category, message, meta);
    appStream.write(log);
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] [${category}]`, message, meta);
    }
  },

  // User action logs (for analytics)
  userAction: (action, userId, userEmail, meta = {}) => {
    const log = formatLog('USER_ACTION', action, `User action: ${action}`, {
      userId,
      userEmail,
      ...meta
    });
    userActionStream.write(log);
    appStream.write(log);
  },

  // API request logs
  apiRequest: (method, path, userId = null, meta = {}) => {
    const log = formatLog('API_REQUEST', 'API', `${method} ${path}`, {
      userId,
      ...meta
    });
    appStream.write(log);
  },

  // Database query logs (for slow queries)
  dbQuery: (query, duration, meta = {}) => {
    if (duration > 1000) { // Log slow queries (>1s)
      const log = formatLog('DB_SLOW_QUERY', 'Database', `Slow query: ${duration}ms`, {
        query,
        duration,
        ...meta
      });
      appStream.write(log);
      console.warn(`[SLOW QUERY] ${duration}ms`, query);
    }
  }
};

// Helper to read recent logs from current files
function getRecentLogs(type = 'all', limit = 100) {
  let fileName = 'app.log';
  
  if (type === 'errors') fileName = 'error.log';
  if (type === 'user-actions') fileName = 'user-actions.log';
  
  const filePath = path.join(LOG_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line);
  const logs = lines.slice(-limit).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
  
  return logs.reverse(); // Most recent first
}

module.exports = { logger, getRecentLogs };
