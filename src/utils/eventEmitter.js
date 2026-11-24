
const EventEmitter = require('events');

const eventEmitter = new EventEmitter();

// Handle application errors without crashing the server
eventEmitter.on('error', (error) => {
    console.error('Application Event Error:', error.message);
});

module.exports = eventEmitter;
