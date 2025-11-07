/**
 * Simple logging utility
 * Provides basic logging functionality
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Log colors for console output
const LOG_COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[37m', // White
    RESET: '\x1b[0m'   // Reset
};

// Log directory
const LOG_DIR = path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Metadata
 * @returns {string} Formatted log
 */
function formatLogMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
}

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Metadata
 */
function writeLogToFile(level, message, meta = {}) {
    try {
        const logMessage = formatLogMessage(level, message, meta);
        const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
        
        fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
        console.error('Failed to write log to file:', error);
    }
}

/**
 * Logger class
 */
class Logger {
    /**
     * Log error message
     * @param {string} message - Log message
     * @param {Object} meta - Metadata
     */
    static error(message, meta = {}) {
        const formattedMessage = `${LOG_COLORS.ERROR}${message}${LOG_COLORS.RESET}`;
        console.error(formattedMessage);
        writeLogToFile(LOG_LEVELS.ERROR, message, meta);
    }

    /**
     * Log warning message
     * @param {string} message - Log message
     * @param {Object} meta - Metadata
     */
    static warn(message, meta = {}) {
        const formattedMessage = `${LOG_COLORS.WARN}${message}${LOG_COLORS.RESET}`;
        console.warn(formattedMessage);
        writeLogToFile(LOG_LEVELS.WARN, message, meta);
    }

    /**
     * Log info message
     * @param {string} message - Log message
     * @param {Object} meta - Metadata
     */
    static info(message, meta = {}) {
        const formattedMessage = `${LOG_COLORS.INFO}${message}${LOG_COLORS.RESET}`;
        console.log(formattedMessage);
        writeLogToFile(LOG_LEVELS.INFO, message, meta);
    }

    /**
     * Log debug message
     * @param {string} message - Log message
     * @param {Object} meta - Metadata
     */
    static debug(message, meta = {}) {
        const formattedMessage = `${LOG_COLORS.DEBUG}${message}${LOG_COLORS.RESET}`;
        console.log(formattedMessage);
        writeLogToFile(LOG_LEVELS.DEBUG, message, meta);
    }

    /**
     * Log message (generic method)
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} meta - Metadata
     */
    static log(level, message, meta = {}) {
        switch (level.toUpperCase()) {
            case LOG_LEVELS.ERROR:
                this.error(message, meta);
                break;
            case LOG_LEVELS.WARN:
                this.warn(message, meta);
                break;
            case LOG_LEVELS.INFO:
                this.info(message, meta);
                break;
            case LOG_LEVELS.DEBUG:
                this.debug(message, meta);
                break;
            default:
                this.info(message, meta);
        }
    }
}

module.exports = Logger;