/**
 * Analytics Service - API client for process analytics
 */

import { API_ENDPOINTS } from '../config/environment.js';

class AnalyticsService {
    /**
     * Get analytics summary for a user
     * @param {string} userId - User ID (defaults to 'default_user')
     * @returns {Promise<Object>} Analytics summary data
     */
    async getAnalyticsSummary(userId = 'default_user') {
        try {
            const response = await fetch(`${API_ENDPOINTS.ANALYTICS_SUMMARY}?user_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch analytics summary');
            }

            return data.data;
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
            throw error;
        }
    }

    /**
     * Get user processes with pagination
     * @param {Object} options - Query options
     * @param {string} options.userId - User ID
     * @param {number} options.limit - Number of processes to fetch
     * @param {string} options.lastEvaluatedKey - Pagination key
     * @returns {Promise<Object>} Process list with pagination info
     */
    async getUserProcesses({ userId = 'default_user', limit = 50, lastEvaluatedKey = null } = {}) {
        try {
            const params = new URLSearchParams({
                user_id: userId,
                limit: limit.toString()
            });

            if (lastEvaluatedKey) {
                params.append('last_evaluated_key', lastEvaluatedKey);
            }

            const response = await fetch(`${API_ENDPOINTS.ANALYTICS_PROCESSES}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch user processes');
            }

            return data.data;
        } catch (error) {
            console.error('Error fetching user processes:', error);
            throw error;
        }
    }

    /**
     * Get recent processes (convenience method)
     * @param {number} limit - Number of recent processes to fetch
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Recent processes array
     */
    async getRecentProcesses(limit = 10, userId = 'default_user') {
        try {
            const data = await this.getUserProcesses({ userId, limit });
            return data.processes || [];
        } catch (error) {
            console.error('Error fetching recent processes:', error);
            throw error;
        }
    }

    /**
     * Get analytics data for dashboard (combines summary and recent processes)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Combined analytics data
     */
    async getDashboardData(userId = 'default_user') {
        try {
            const [summary, processes] = await Promise.all([
                this.getAnalyticsSummary(userId),
                this.getRecentProcesses(20, userId)
            ]);

            return {
                summary,
                recentProcesses: processes,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount in USD
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(amount);
    }

    /**
     * Format time duration for display
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }

    /**
     * Format date for display
     * @param {string} isoString - ISO date string
     * @returns {string} Formatted date string
     */
    formatDate(isoString) {
        return new Date(isoString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get status color for process status
     * @param {string} status - Process status
     * @returns {string} CSS color class
     */
    getStatusColor(status) {
        const colors = {
            'success': 'text-green-500',
            'failed': 'text-red-500',
            'partial': 'text-yellow-500',
            'pending': 'text-blue-500'
        };
        return colors[status] || 'text-gray-500';
    }

    /**
     * Get process type color for display
     * @param {string} type - Process type
     * @returns {string} CSS class for styling
     */
    getProcessTypeColor(type) {
        const colors = {
            'miscellaneous': 'bg-blue-100 text-blue-800',
            'reconciliation': 'bg-green-100 text-green-800',
            'transformation': 'bg-purple-100 text-purple-800',
            'delta_analysis': 'bg-orange-100 text-orange-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Calculate cost savings or efficiency metrics
     * @param {Object} summary - Analytics summary data
     * @returns {Object} Calculated metrics
     */
    calculateMetrics(summary) {
        const avgTokensPerProcess = summary.total_processes > 0 
            ? summary.total_tokens_used / summary.total_processes 
            : 0;
        
        const dataEfficiency = summary.total_input_rows > 0 
            ? (summary.total_output_rows / summary.total_input_rows) * 100 
            : 0;

        return {
            avgTokensPerProcess: Math.round(avgTokensPerProcess),
            dataEfficiency: dataEfficiency.toFixed(1),
            successRate: summary.success_rate,
            avgProcessingTime: summary.avg_processing_time_seconds
        };
    }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;