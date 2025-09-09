// Miscellaneous Data Processing Service
import { ENV_CONFIG } from '../config/environment.js';

class MiscellaneousService {
    constructor() {
        this.baseURL = `${ENV_CONFIG.API_BASE_URL}/api/miscellaneous`;
    }

    /**
     * Process data using natural language query
     * @param {Object} request - The processing request
     * @param {string} request.process_type - Type of processing
     * @param {string} request.process_name - Name for the process
     * @param {string} request.user_prompt - Natural language query
     * @param {Array} request.files - Array of file references
     * @param {string} request.output_format - Output format (json, csv, excel)
     * @returns {Promise} Processing response
     */
    async processData(request) {
        try {
            const response = await fetch(`${this.baseURL}/process/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error processing data:', error);
            throw error;
        }
    }

    /**
     * Get results from a processing operation
     * @param {string} processId - The process ID
     * @param {number} page - Page number (default: 1)
     * @param {number} pageSize - Records per page (default: 1000)
     * @param {string} format - Response format (default: json)
     * @returns {Promise} Results data
     */
    async getResults(processId, page = 1, pageSize = 1000, format = 'json') {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: pageSize.toString(),
                format: format
            });

            const response = await fetch(`${this.baseURL}/results/${processId}?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error getting results:', error);
            throw error;
        }
    }

    /**
     * Download results in specified format
     * @param {string} processId - The process ID
     * @param {string} format - Download format (csv, excel)
     * @returns {Promise} Download blob
     */
    async downloadResults(processId, format = 'csv') {
        try {
            const response = await fetch(`${this.baseURL}/download/${processId}?format=${format}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Get filename from response headers or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `miscellaneous_${processId}.${format}`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return { success: true, filename };
        } catch (error) {
            console.error('Error downloading results:', error);
            throw error;
        }
    }

    /**
     * Get summary of processing results
     * @param {string} processId - The process ID
     * @returns {Promise} Summary data
     */
    async getSummary(processId) {
        try {
            const response = await fetch(`${this.baseURL}/results/${processId}/summary`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error getting summary:', error);
            throw error;
        }
    }

    /**
     * Delete processing results
     * @param {string} processId - The process ID
     * @returns {Promise} Deletion response
     */
    async deleteResults(processId) {
        try {
            const response = await fetch(`${this.baseURL}/results/${processId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error deleting results:', error);
            throw error;
        }
    }

    /**
     * Explain generated SQL query
     * @param {string} sqlQuery - The SQL query to explain
     * @returns {Promise} Explanation response
     */
    async explainSQL(sqlQuery) {
        try {
            const response = await fetch(`${this.baseURL}/explain-sql/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sql_query: sqlQuery
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error explaining SQL:', error);
            throw error;
        }
    }

    /**
     * Check service health
     * @returns {Promise} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error checking health:', error);
            throw error;
        }
    }

    /**
     * Get example queries for different use cases
     * @returns {Array} Array of example queries organized by category
     */
    getExampleQueries() {
        return [
            {
                category: "Data Reconciliation",
                examples: [
                    "Compare file_1 and file_2 to find records missing from file_2 based on transaction_id",
                    "Find mismatches between file_1 and file_2 where amounts don't match",
                    "Show records that exist in file_1 but not in file_2",
                    "Reconcile customer data between file_1 and file_2 using email address as key"
                ]
            },
            {
                category: "Data Merging & Deduplication",
                examples: [
                    "Merge all files and remove duplicates based on email address",
                    "Combine file_1 and file_2 and keep only unique records based on customer_id",
                    "Join file_1 with file_2 on customer_id and merge their data",
                    "Union all files and show consolidated customer information"
                ]
            },
            {
                category: "Delta Analysis",
                examples: [
                    "Show differences between January data (file_1) and February data (file_2)",
                    "Compare sales between file_1 and file_2 and highlight changes in revenue",
                    "Find products with changed prices between file_1 and file_2",
                    "Calculate month-over-month growth comparing file_1 to file_2"
                ]
            },
            {
                category: "Analytics & Calculations",
                examples: [
                    "Calculate running totals by customer ordered by transaction date",
                    "Find customers in the top 10% by spending",
                    "Show monthly sales trends and identify outliers",
                    "Calculate average, sum, and count by product category"
                ]
            },
            {
                category: "Filtering & Segmentation",
                examples: [
                    "Show customers who spent more than $1000 in total",
                    "Filter transactions from the last 30 days",
                    "Find all records where status is 'pending' or 'failed'",
                    "Show products with zero inventory"
                ]
            }
        ];
    }

    /**
     * Validate file selection for processing
     * @param {Array} files - Selected files
     * @returns {Object} Validation result
     */
    validateFileSelection(files) {
        const errors = [];
        const warnings = [];

        if (!files || files.length === 0) {
            errors.push("At least one file must be selected");
        }

        if (files && files.length > 5) {
            errors.push("Maximum 5 files are supported");
        }

        // Check for duplicate files
        if (files) {
            const fileIds = files.map(f => f.file_id);
            const uniqueIds = new Set(fileIds);
            if (fileIds.length !== uniqueIds.size) {
                errors.push("Duplicate files selected");
            }
        }

        // Check file sizes and row counts
        if (files) {
            const largeFiles = files.filter(f => f.totalRows > 100000);
            if (largeFiles.length > 0) {
                warnings.push(`Large files detected (${largeFiles.length} files with >100k rows). Processing may take longer.`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate user prompt
     * @param {string} prompt - User's natural language prompt
     * @returns {Object} Validation result
     */
    validatePrompt(prompt) {
        const errors = [];
        const warnings = [];

        if (!prompt || prompt.trim().length === 0) {
            errors.push("Query prompt is required");
        }

        if (prompt && prompt.trim().length < 10) {
            errors.push("Query prompt must be at least 10 characters");
        }

        if (prompt && prompt.length > 1000) {
            errors.push("Query prompt must be less than 1000 characters");
        }

        // Check for potentially dangerous keywords (informational only)
        const dangerousKeywords = ['drop', 'delete', 'truncate', 'alter', 'create table'];
        const lowerPrompt = prompt.toLowerCase();
        const foundDangerous = dangerousKeywords.filter(kw => lowerPrompt.includes(kw));
        
        if (foundDangerous.length > 0) {
            warnings.push(`Your query contains keywords that might not work: ${foundDangerous.join(', ')}. The system only supports read-only operations.`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Format processing error for display
     * @param {Error} error - The error object
     * @returns {string} Formatted error message
     */
    formatError(error) {
        if (!error) return "Unknown error occurred";

        // Handle different types of errors
        if (error.message) {
            if (error.message.includes('404')) {
                return "Process or file not found. Please check if your files are still available.";
            }
            if (error.message.includes('400')) {
                return "Invalid request. Please check your file selection and query.";
            }
            if (error.message.includes('500')) {
                return "Server error occurred. Please try again or contact support.";
            }
            return error.message;
        }

        return "An unexpected error occurred. Please try again.";
    }
}

// Create and export service instance
export const miscellaneousService = new MiscellaneousService();