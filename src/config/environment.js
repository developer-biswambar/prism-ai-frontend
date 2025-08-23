// Frontend Environment Configuration
// Centralized configuration for API endpoints and environment variables

/**
 * Get environment variable value with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value or default
 */
const getEnvVar = (key, defaultValue) => {
    // In React, environment variables must start with REACT_APP_
    // Use import.meta.env for Vite instead of process.env
    return import.meta.env[key] || defaultValue;
};

/**
 * Environment Configuration
 */
export const ENV_CONFIG = {
    // API Configuration
    API_BASE_URL: getEnvVar('REACT_APP_API_URL', 'http://localhost:8000'),
    
    // Application Environment
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    
    // Feature Flags
    DEBUG_MODE: getEnvVar('REACT_APP_DEBUG', 'false') === 'true',
    
    // API Timeouts (in milliseconds)
    API_TIMEOUT: parseInt(getEnvVar('REACT_APP_API_TIMEOUT', '30000')),
    
    // File Upload Settings
    MAX_FILE_SIZE: parseInt(getEnvVar('REACT_APP_MAX_FILE_SIZE', '100')), // MB
    
    // Pagination Settings
    DEFAULT_PAGE_SIZE: parseInt(getEnvVar('REACT_APP_DEFAULT_PAGE_SIZE', '1000')),
    
    // UI Settings
    ANIMATION_DURATION: parseInt(getEnvVar('REACT_APP_ANIMATION_DURATION', '400')), // seconds
};

/**
 * API Endpoints Configuration
 */
export const API_ENDPOINTS = {
    // Base API URL
    BASE: ENV_CONFIG.API_BASE_URL,
    
    // Health Check
    HEALTH: `${ENV_CONFIG.API_BASE_URL}/health`,
    
    // File Management
    FILES: `${ENV_CONFIG.API_BASE_URL}/files`,
    UPLOAD: `${ENV_CONFIG.API_BASE_URL}/upload`,
    
    // Reconciliation
    RECONCILIATION: `${ENV_CONFIG.API_BASE_URL}/reconciliation`,
    
    // Transformation
    TRANSFORMATION: `${ENV_CONFIG.API_BASE_URL}/transformation`,
    
    // Delta Generation
    DELTA: `${ENV_CONFIG.API_BASE_URL}/delta`,
    
    // AI Assistance
    AI_ASSISTANCE: `${ENV_CONFIG.API_BASE_URL}/ai-assistance`,
    
    // Viewer
    VIEWER: `${ENV_CONFIG.API_BASE_URL}/viewer`,
    
    // Debug and Performance
    DEBUG: `${ENV_CONFIG.API_BASE_URL}/debug`,
    PERFORMANCE: `${ENV_CONFIG.API_BASE_URL}/performance`,
    
    // Save Results
    SAVE_RESULTS: `${ENV_CONFIG.API_BASE_URL}/save-results`,
    
    // Recent Results
    RECENT_RESULTS: `${ENV_CONFIG.API_BASE_URL}/recent-results`,
    
    // File Generator
    FILE_GENERATOR: `${ENV_CONFIG.API_BASE_URL}/file-generator`,
};

/**
 * Production Environment Check
 */
export const isProduction = () => ENV_CONFIG.NODE_ENV === 'production';

/**
 * Development Environment Check
 */
export const isDevelopment = () => ENV_CONFIG.NODE_ENV === 'development';

/**
 * Debug Mode Check
 */
export const isDebugMode = () => ENV_CONFIG.DEBUG_MODE;

/**
 * Log configuration (for debugging)
 */
export const logEnvironmentConfig = () => {
    if (isDevelopment()) {
        console.log('Frontend Environment Configuration:', {
            API_BASE_URL: ENV_CONFIG.API_BASE_URL,
            NODE_ENV: ENV_CONFIG.NODE_ENV,
            DEBUG_MODE: ENV_CONFIG.DEBUG_MODE,
            isProduction: isProduction(),
            isDevelopment: isDevelopment(),
        });
    }
};

// Export default configuration
export default ENV_CONFIG;