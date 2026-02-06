// test-logger.js - Quick test to verify logging works
const { logger } = require('./lib/logger');

console.log('Testing logger...\n');

// Test info log
logger.info('TEST', 'Logger initialized successfully');

// Test warning
logger.warn('TEST', 'This is a test warning');

// Test error
logger.error('TEST', 'This is a test error', new Error('Sample error'));

// Test user action
logger.userAction('LOGIN', 'test-user-123', 'test@iitb.ac.in', { 
  ip: '127.0.0.1',
  browser: 'Chrome'
});

console.log('\nLogs written! Check the logs/ directory:');
console.log('  - logs/app.log (all logs)');
console.log('  - logs/error.log (errors only)');
console.log('  - logs/user-actions.log (user actions only)\n');

// Give streams time to flush
setTimeout(() => {
  console.log('Test complete! You can now delete this file.');
  process.exit(0);
}, 1000);
