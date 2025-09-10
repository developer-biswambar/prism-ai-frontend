/**
 * Template Service
 * Handles API communication for template management
 */

import { API_ENDPOINTS } from '../config/environment';

class TemplateService {
    constructor() {
        this.baseURL = API_ENDPOINTS.TEMPLATES;
    }

    // Template CRUD Operations
    async createTemplate(templateData) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create template');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    async getTemplate(templateId, templateType = null) {
        try {
            const url = new URL(`${this.baseURL}/${templateId}`);
            if (templateType) {
                url.searchParams.append('template_type', templateType);
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Template not found');
                }
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get template');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting template:', error);
            throw error;
        }
    }

    async updateTemplate(templateId, updateData, templateType = null) {
        try {
            const url = new URL(`${this.baseURL}/${templateId}`);
            if (templateType) {
                url.searchParams.append('template_type', templateType);
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
                throw new Error(error.detail || 'Failed to update template');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    }

    async deleteTemplate(templateId, templateType = null) {
        try {
            const url = new URL(`${this.baseURL}/${templateId}`);
            if (templateType) {
                url.searchParams.append('template_type', templateType);
            }

            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to delete template');
            }

            return true;
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }

    // Template Discovery
    async listTemplates(filters = {}) {
        try {
            const url = new URL(this.baseURL);
            
            // Add filter parameters
            if (filters.template_type) url.searchParams.append('template_type', filters.template_type);
            if (filters.category) url.searchParams.append('category', filters.category);
            if (filters.is_public !== undefined) url.searchParams.append('is_public', filters.is_public);
            if (filters.created_by) url.searchParams.append('created_by', filters.created_by);
            if (filters.limit) url.searchParams.append('limit', filters.limit);
            if (filters.offset) url.searchParams.append('offset', filters.offset);

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to list templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error listing templates:', error);
            throw error;
        }
    }

    async searchTemplates(query, filters = {}) {
        try {
            const url = new URL(`${this.baseURL}/search/query`);
            url.searchParams.append('q', query);
            
            // Add filter parameters
            if (filters.template_type) url.searchParams.append('template_type', filters.template_type);
            if (filters.category) url.searchParams.append('category', filters.category);
            if (filters.tags && filters.tags.length > 0) {
                filters.tags.forEach(tag => url.searchParams.append('tags', tag));
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to search templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching templates:', error);
            throw error;
        }
    }

    async getPopularTemplates(limit = 10, templateType = null) {
        try {
            const url = new URL(`${this.baseURL}/popular/list`);
            url.searchParams.append('limit', limit);
            if (templateType) url.searchParams.append('template_type', templateType);

            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get popular templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting popular templates:', error);
            throw error;
        }
    }

    // Template Application
    async suggestTemplates(userPrompt, fileSchemas, limit = 5) {
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
                throw new Error(error.detail || 'Failed to suggest templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error suggesting templates:', error);
            throw error;
        }
    }

    async applyTemplate(templateId, files, parameters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: templateId,
                    files: files,
                    parameters: parameters
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to apply template');
            }

            return await response.json();
        } catch (error) {
            console.error('Error applying template:', error);
            throw error;
        }
    }

    async createTemplateFromQuery(queryData, templateMetadata) {
        try {
            const response = await fetch(`${this.baseURL}/create-from-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query_data: queryData,
                    template_name: templateMetadata.name,
                    template_description: templateMetadata.description,
                    template_type: templateMetadata.template_type,
                    category: templateMetadata.category,
                    tags: templateMetadata.tags || [],
                    is_public: templateMetadata.is_public || false,
                    created_by: templateMetadata.created_by
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create template from query');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating template from query:', error);
            throw error;
        }
    }

    // Template Analytics
    async markTemplateUsage(templateId, templateType = null) {
        try {
            const url = new URL(`${this.baseURL}/${templateId}/usage`);
            if (templateType) {
                url.searchParams.append('template_type', templateType);
            }

            const response = await fetch(url, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to mark template usage');
            }

            return true;
        } catch (error) {
            console.error('Error marking template usage:', error);
            throw error;
        }
    }

    async rateTemplate(templateId, rating, templateType = null) {
        try {
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const url = new URL(`${this.baseURL}/${templateId}/rating`);
            if (templateType) {
                url.searchParams.append('template_type', templateType);
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
                throw new Error(error.detail || 'Failed to rate template');
            }

            return true;
        } catch (error) {
            console.error('Error rating template:', error);
            throw error;
        }
    }

    // Utility Methods
    async getCategories(templateType = null) {
        try {
            const url = new URL(`${this.baseURL}/categories/list`);
            if (templateType) url.searchParams.append('template_type', templateType);

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

    async getTemplateTypes() {
        try {
            const response = await fetch(`${this.baseURL}/types/list`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to get template types');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting template types:', error);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health/check`);
            return await response.json();
        } catch (error) {
            console.error('Error checking template service health:', error);
            return { status: 'unhealthy', error: error.message };
        }
    }

    // Helper methods
    formatTemplateTypeDisplay(templateType) {
        const typeMap = {
            'data_processing': 'Data Processing',
            'reconciliation': 'Reconciliation',
            'analysis': 'Analysis',
            'transformation': 'Transformation',
            'reporting': 'Reporting'
        };
        return typeMap[templateType] || templateType;
    }

    getTemplateTypeIcon(templateType) {
        const iconMap = {
            'data_processing': '⚙️',
            'reconciliation': '🔄',
            'analysis': '📊',
            'transformation': '🔧',
            'reporting': '📋'
        };
        return iconMap[templateType] || '📄';
    }

    getRatingStars(rating, ratingCount) {
        const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        return ratingCount > 0 ? `${stars} (${ratingCount})` : 'No ratings';
    }
}

// Export singleton instance
export const templateService = new TemplateService();
export default templateService;