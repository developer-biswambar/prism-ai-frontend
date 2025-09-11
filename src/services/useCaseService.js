/**
 * Use Case Service
 * Handles API communication for use case management
 */

import { API_ENDPOINTS } from '../config/environment';

class UseCaseService {
    constructor() {
        this.baseURL = API_ENDPOINTS.SAVED_USE_CASES;
    }

    // Use Case CRUD Operations
    async createUseCase(useCaseData) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(useCaseData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create use case');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating use case:', error);
            throw error;
        }
    }

    async getUseCase(useCaseId, useCaseType = null) {
        try {
            const url = new URL(`${this.baseURL}/${useCaseId}`);
            if (useCaseType) {
                url.searchParams.append('use_case_type', useCaseType);
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Use case not found');
                }
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get use case');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting use case:', error);
            throw error;
        }
    }

    async updateUseCase(useCaseId, updateData, useCaseType = null) {
        try {
            const url = new URL(`${this.baseURL}/${useCaseId}`);
            if (useCaseType) {
                url.searchParams.append('use_case_type', useCaseType);
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to update use case');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating use case:', error);
            throw error;
        }
    }

    async deleteUseCase(useCaseId, useCaseType = null) {
        try {
            const url = new URL(`${this.baseURL}/${useCaseId}`);
            if (useCaseType) {
                url.searchParams.append('use_case_type', useCaseType);
            }

            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to delete use case');
            }

            return true;
        } catch (error) {
            console.error('Error deleting use case:', error);
            throw error;
        }
    }

    // Use Case Discovery
    async listUseCases(filters = {}) {
        try {
            const url = new URL(this.baseURL);
            
            // Add filter parameters
            if (filters.use_case_type) url.searchParams.append('use_case_type', filters.use_case_type);
            if (filters.category) url.searchParams.append('category', filters.category);
            if (filters.is_public !== undefined) url.searchParams.append('is_public', filters.is_public);
            if (filters.created_by) url.searchParams.append('created_by', filters.created_by);
            if (filters.limit) url.searchParams.append('limit', filters.limit);
            if (filters.offset) url.searchParams.append('offset', filters.offset);

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to list use cases');
            }

            return await response.json();
        } catch (error) {
            console.error('Error listing use cases:', error);
            throw error;
        }
    }

    async searchUseCases(query, filters = {}) {
        try {
            const url = new URL(`${this.baseURL}/search/query`);
            url.searchParams.append('q', query);
            
            // Add filter parameters
            if (filters.use_case_type) url.searchParams.append('use_case_type', filters.use_case_type);
            if (filters.category) url.searchParams.append('category', filters.category);
            if (filters.tags && filters.tags.length > 0) {
                filters.tags.forEach(tag => url.searchParams.append('tags', tag));
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to search use cases');
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching use cases:', error);
            throw error;
        }
    }

    async getPopularUseCases(limit = 10, useCaseType = null) {
        try {
            const url = new URL(`${this.baseURL}/popular/list`);
            url.searchParams.append('limit', limit);
            if (useCaseType) url.searchParams.append('use_case_type', useCaseType);

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get popular use cases');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting popular use cases:', error);
            throw error;
        }
    }

    // Use Case Application
    async suggestUseCases(userPrompt, fileSchemas, limit = 5) {
        try {
            const response = await fetch(`${this.baseURL}/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_prompt: userPrompt,
                    file_schemas: fileSchemas,
                    limit: limit
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to suggest use cases');
            }

            return await response.json();
        } catch (error) {
            console.error('Error suggesting use cases:', error);
            throw error;
        }
    }

    // Smart Template Execution
    async smartExecuteUseCase(useCaseId, files, parameters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: useCaseId,
                    files: files,
                    parameters: parameters
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to execute use case');
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing use case:', error);
            throw error;
        }
    }

    async executeUseCaseWithAI(useCaseId, files, parameters = {}) {
        try {
            console.log('🤖 Executing use case with AI assistance:', useCaseId);
            const response = await fetch(`${this.baseURL}/execute/ai-assisted`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: useCaseId,
                    files: files,
                    parameters: parameters
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to execute use case with AI assistance');
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing use case with AI:', error);
            throw error;
        }
    }

    async executeWithUserMapping(useCaseId, files, userMapping, parameters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/execute/with-mapping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: useCaseId,
                    files: files,
                    column_mapping: userMapping,
                    parameters: parameters
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to execute use case with mapping');
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing use case with mapping:', error);
            throw error;
        }
    }

    async applyUseCase(useCaseId, files, parameters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    use_case_id: useCaseId,
                    files: files,
                    parameters: parameters
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to apply use case');
            }

            return await response.json();
        } catch (error) {
            console.error('Error applying use case:', error);
            throw error;
        }
    }

    async createUseCaseFromQuery(queryData, useCaseMetadata) {
        try {
            const response = await fetch(`${this.baseURL}/create-from-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query_data: queryData,
                    // Map to backend expected field names
                    template_name: useCaseMetadata.name,
                    template_description: useCaseMetadata.description,
                    template_type: useCaseMetadata.use_case_type,
                    category: useCaseMetadata.category,
                    tags: useCaseMetadata.tags || [],
                    created_by: useCaseMetadata.created_by,
                    
                    // Enhanced use case data
                    template_content: useCaseMetadata.use_case_content,
                    template_config: useCaseMetadata.template_config,
                    template_metadata: useCaseMetadata.use_case_metadata
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create use case from query');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating use case from query:', error);
            throw error;
        }
    }

    // Use Case Analytics
    async markUseCaseUsage(useCaseId, useCaseType = null) {
        try {
            const url = new URL(`${this.baseURL}/${useCaseId}/usage`);
            if (useCaseType) {
                url.searchParams.append('use_case_type', useCaseType);
            }

            const response = await fetch(url, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to mark use case usage');
            }

            return true;
        } catch (error) {
            console.error('Error marking use case usage:', error);
            throw error;
        }
    }

    async rateUseCase(useCaseId, rating, useCaseType = null) {
        try {
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const url = new URL(`${this.baseURL}/${useCaseId}/rating`);
            if (useCaseType) {
                url.searchParams.append('use_case_type', useCaseType);
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to rate use case');
            }

            return true;
        } catch (error) {
            console.error('Error rating use case:', error);
            throw error;
        }
    }

    // Utility Methods
    async getCategories(useCaseType = null) {
        try {
            const url = new URL(`${this.baseURL}/categories/list`);
            if (useCaseType) url.searchParams.append('use_case_type', useCaseType);

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get categories');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }

    async getUseCaseTypes() {
        try {
            const response = await fetch(`${this.baseURL}/types/list`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get use case types');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting use case types:', error);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health/check`);
            return await response.json();
        } catch (error) {
            console.error('Error checking use case service health:', error);
            return { status: 'unhealthy', error: error.message };
        }
    }

    // Helper methods
    formatUseCaseTypeDisplay(useCaseType) {
        const typeMap = {
            'data_processing': 'Data Processing',
            'reconciliation': 'Reconciliation',
            'analysis': 'Analysis',
            'transformation': 'Transformation',
            'reporting': 'Reporting'
        };
        return typeMap[useCaseType] || useCaseType;
    }

    getUseCaseTypeIcon(useCaseType) {
        const iconMap = {
            'data_processing': '⚙️',
            'reconciliation': '🔄',
            'analysis': '📊',
            'transformation': '🔧',
            'reporting': '📋'
        };
        return iconMap[useCaseType] || '📄';
    }

    getRatingStars(rating, ratingCount) {
        const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        return ratingCount > 0 ? `${stars} (${ratingCount})` : 'No ratings';
    }
}

// Export singleton instance
export const useCaseService = new UseCaseService();
export default useCaseService;