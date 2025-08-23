// src/services/unifiedRulesApiService.js - Unified Rules Management API Service
import { apiService } from './defaultApi.js';

/**
 * Unified service for managing all types of rules: Delta, Reconciliation, and Transformation
 * Works with the DynamoDB backend and provides fallback to existing individual services
 */
const getEnvVar = (key, defaultValue) => {
    // In React, environment variables must start with REACT_APP_
    // Use import.meta.env for Vite instead of process.env
    return import.meta.env[key] || defaultValue;
};

class UnifiedRulesApiService {
    constructor() {
        this.BASE_URL = getEnvVar('BASE_URL','localhost:8000');
        
        // Rule type endpoints mapping
        this.endpoints = {
            delta: '/delta-rules',
            reconciliation: '/rules',
            transformation: '/rules/transformation'
        };
        
        // Local storage keys for offline fallback
        this.storageKeys = {
            delta: 'delta_rules_unified',
            reconciliation: 'reconciliation_rules_unified', 
            transformation: 'transformation_rules_unified'
        };
        
        this.MAX_RECENT_RULES = 10;
    }

    // ===========================================
    // CORE API OPERATIONS
    // ===========================================

    /**
     * Save a rule of any type
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {Object} metadata - Rule metadata (name, description, category, etc.)
     * @param {Object} ruleConfig - Rule configuration specific to the type
     * @returns {Promise<Object>} - {success, rule, error}
     */
    async saveRule(ruleType, metadata, ruleConfig) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const payload = {
                metadata: {
                    name: metadata.name,
                    description: metadata.description || '',
                    category: metadata.category || this.getDefaultCategory(ruleType),
                    tags: metadata.tags || [],
                    template_id: metadata.template_id,
                    template_name: metadata.template_name,
                    rule_type: ruleType === 'delta' ? 'delta_generation' : ruleType
                },
                rule_config: ruleConfig
            };

            const response = await fetch(`${this.BASE_URL}${endpoint}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const savedRule = await response.json();
            this.addToRecentRules(ruleType, savedRule);
            
            return { success: true, rule: savedRule };

        } catch (error) {
            console.error(`Error saving ${ruleType} rule:`, error);
            
            // Fallback to local storage
            try {
                const localRule = this.createLocalRule(ruleType, metadata, ruleConfig);
                this.saveRuleLocally(ruleType, localRule);
                return { success: true, rule: localRule, isLocal: true };
            } catch (localError) {
                console.error('Local save also failed:', localError);
                return { success: false, error: error.message };
            }
        }
    }

    /**
     * Get all rules of a specific type
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {Object} filters - Optional filters (category, template_id, limit, offset)
     * @returns {Promise<Object>} - {success, rules, error}
     */
    async getRules(ruleType, filters = {}) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const queryParams = new URLSearchParams();
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.template_id) queryParams.append('template_id', filters.template_id);
            if (filters.limit) queryParams.append('limit', filters.limit.toString());
            if (filters.offset) queryParams.append('offset', filters.offset.toString());

            const url = `${this.BASE_URL}${endpoint}/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const rules = await response.json();
            
            return { success: true, rules, source: 'backend' };

        } catch (error) {
            console.error(`Error getting ${ruleType} rules:`, error);
            
            // Fallback to local storage
            const localRules = this.getLocalRules(ruleType);
            const filteredRules = this.filterRules(localRules, filters);
            
            return { 
                success: true, 
                rules: filteredRules, 
                source: 'local',
                warning: 'Using offline data due to connection issues'
            };
        }
    }

    /**
     * Get a specific rule by ID
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {string} ruleId - Rule ID
     * @returns {Promise<Object>} - {success, rule, error}
     */
    async getRule(ruleType, ruleId) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/${ruleId}`);

            if (response.status === 404) {
                return { success: false, error: 'Rule not found' };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const rule = await response.json();
            
            return { success: true, rule };

        } catch (error) {
            console.error(`Error getting ${ruleType} rule ${ruleId}:`, error);
            
            // Fallback to local storage
            const localRules = this.getLocalRules(ruleType);
            const rule = localRules.find(r => r.id === ruleId);
            
            if (rule) {
                return { success: true, rule, isLocal: true };
            } else {
                return { success: false, error: 'Rule not found' };
            }
        }
    }

    /**
     * Update an existing rule
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {string} ruleId - Rule ID
     * @param {Object} updates - Updates to apply (metadata and/or rule_config)
     * @returns {Promise<Object>} - {success, rule, error}
     */
    async updateRule(ruleType, ruleId, updates) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/${ruleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            if (response.status === 404) {
                return { success: false, error: 'Rule not found' };
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const updatedRule = await response.json();
            
            return { success: true, rule: updatedRule };

        } catch (error) {
            console.error(`Error updating ${ruleType} rule ${ruleId}:`, error);
            
            // Fallback to local storage
            try {
                this.updateRuleLocally(ruleType, ruleId, updates);
                const localRules = this.getLocalRules(ruleType);
                const updatedRule = localRules.find(r => r.id === ruleId);
                
                if (updatedRule) {
                    return { success: true, rule: updatedRule, isLocal: true };
                } else {
                    return { success: false, error: 'Rule not found in local storage' };
                }
            } catch (localError) {
                return { success: false, error: error.message };
            }
        }
    }

    /**
     * Delete a rule
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {string} ruleId - Rule ID
     * @returns {Promise<Object>} - {success, error}
     */
    async deleteRule(ruleType, ruleId) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/${ruleId}`, {
                method: 'DELETE'
            });

            if (response.status === 404) {
                return { success: false, error: 'Rule not found' };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return { success: true };

        } catch (error) {
            console.error(`Error deleting ${ruleType} rule ${ruleId}:`, error);
            
            // Fallback to local storage
            try {
                this.deleteRuleLocally(ruleType, ruleId);
                return { success: true, isLocal: true };
            } catch (localError) {
                return { success: false, error: error.message };
            }
        }
    }

    /**
     * Mark a rule as used (increment usage count)
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {string} ruleId - Rule ID
     * @returns {Promise<Object>} - {success, usage_count, error}
     */
    async markRuleAsUsed(ruleType, ruleId) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/${ruleId}/use`, {
                method: 'POST'
            });

            if (response.status === 404) {
                return { success: false, error: 'Rule not found' };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            return { success: true, usage_count: result.usage_count };

        } catch (error) {
            console.error(`Error marking ${ruleType} rule ${ruleId} as used:`, error);
            
            // Fallback to local storage
            try {
                const localRules = this.getLocalRules(ruleType);
                const ruleIndex = localRules.findIndex(r => r.id === ruleId);
                
                if (ruleIndex !== -1) {
                    localRules[ruleIndex].usage_count = (localRules[ruleIndex].usage_count || 0) + 1;
                    localRules[ruleIndex].last_used_at = new Date().toISOString();
                    localStorage.setItem(this.storageKeys[ruleType], JSON.stringify(localRules));
                    
                    return { success: true, usage_count: localRules[ruleIndex].usage_count, isLocal: true };
                } else {
                    return { success: false, error: 'Rule not found in local storage' };
                }
            } catch (localError) {
                return { success: false, error: error.message };
            }
        }
    }

    /**
     * Search rules with filters
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {Object} searchFilters - Search criteria
     * @returns {Promise<Object>} - {success, rules, error}
     */
    async searchRules(ruleType, searchFilters) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchFilters)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const rules = await response.json();
            
            return { success: true, rules };

        } catch (error) {
            console.error(`Error searching ${ruleType} rules:`, error);
            
            // Fallback to local search
            const localRules = this.getLocalRules(ruleType);
            const filteredRules = this.searchLocalRules(localRules, searchFilters);
            
            return { 
                success: true, 
                rules: filteredRules,
                isLocal: true
            };
        }
    }

    /**
     * Get available categories for a rule type
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @returns {Promise<Object>} - {success, categories, error}
     */
    async getCategories(ruleType) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/categories/list`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            return { success: true, categories: result.categories };

        } catch (error) {
            console.error(`Error getting ${ruleType} categories:`, error);
            
            // Return default categories
            return { 
                success: true, 
                categories: this.getDefaultCategories(ruleType),
                isLocal: true
            };
        }
    }

    // ===========================================
    // BULK OPERATIONS
    // ===========================================

    /**
     * Get all rules across all types
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - {success, rules, error}
     */
    async getAllRules(filters = {}) {
        try {
            const results = await Promise.all([
                this.getRules('delta', filters),
                this.getRules('reconciliation', filters),
                this.getRules('transformation', filters)
            ]);

            const allRules = [];
            let hasErrors = false;
            let sources = new Set();

            results.forEach((result, index) => {
                const ruleType = ['delta', 'reconciliation', 'transformation'][index];
                
                if (result.success) {
                    // Add rule type to each rule for identification
                    result.rules.forEach(rule => {
                        rule.rule_type = ruleType;
                        allRules.push(rule);
                    });
                    if (result.source) sources.add(result.source);
                } else {
                    hasErrors = true;
                }
            });

            // Sort by updated_at desc
            allRules.sort((a, b) => {
                const aDate = new Date(a.updated_at || a.created_at);
                const bDate = new Date(b.updated_at || b.created_at);
                return bDate - aDate;
            });

            return { 
                success: true, 
                rules: allRules,
                sources: Array.from(sources),
                partialFailure: hasErrors
            };

        } catch (error) {
            console.error('Error getting all rules:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bulk delete rules
     * @param {string} ruleType - 'delta', 'reconciliation', 'transformation'
     * @param {Array} ruleIds - Array of rule IDs to delete
     * @returns {Promise<Object>} - {success, deleted_count, not_found_ids, error}
     */
    async bulkDeleteRules(ruleType, ruleIds) {
        try {
            const endpoint = this.endpoints[ruleType];
            if (!endpoint) {
                throw new Error(`Unsupported rule type: ${ruleType}`);
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ruleIds)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            return { 
                success: true, 
                deleted_count: result.deleted_count,
                not_found_ids: result.not_found_ids || []
            };

        } catch (error) {
            console.error(`Error bulk deleting ${ruleType} rules:`, error);
            
            // Fallback to individual deletes on local storage
            let deleted_count = 0;
            let not_found_ids = [];

            const localRules = this.getLocalRules(ruleType);
            
            for (const ruleId of ruleIds) {
                const ruleIndex = localRules.findIndex(r => r.id === ruleId);
                if (ruleIndex !== -1) {
                    localRules.splice(ruleIndex, 1);
                    deleted_count++;
                } else {
                    not_found_ids.push(ruleId);
                }
            }
            
            localStorage.setItem(this.storageKeys[ruleType], JSON.stringify(localRules));
            
            return { 
                success: true, 
                deleted_count,
                not_found_ids,
                isLocal: true
            };
        }
    }

    // ===========================================
    // LOCAL STORAGE FALLBACK METHODS
    // ===========================================

    createLocalRule(ruleType, metadata, ruleConfig) {
        const timestamp = new Date().toISOString();
        const ruleId = `${ruleType}_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            id: ruleId,
            name: metadata.name,
            description: metadata.description || '',
            category: metadata.category || this.getDefaultCategory(ruleType),
            tags: metadata.tags || [],
            template_id: metadata.template_id,
            template_name: metadata.template_name,
            rule_type: ruleType === 'delta' ? 'delta_generation' : ruleType,
            created_at: timestamp,
            updated_at: timestamp,
            version: '1.0',
            rule_config: ruleConfig,
            usage_count: 0,
            last_used_at: null
        };
    }

    saveRuleLocally(ruleType, rule) {
        try {
            const existingRules = this.getLocalRules(ruleType);
            const updatedRules = [...existingRules, rule];
            localStorage.setItem(this.storageKeys[ruleType], JSON.stringify(updatedRules));
            this.addToRecentRules(ruleType, rule);
            return true;
        } catch (error) {
            console.error(`Error saving ${ruleType} rule locally:`, error);
            return false;
        }
    }

    getLocalRules(ruleType) {
        try {
            const rules = localStorage.getItem(this.storageKeys[ruleType]);
            return rules ? JSON.parse(rules) : [];
        } catch (error) {
            console.error(`Error getting local ${ruleType} rules:`, error);
            return [];
        }
    }

    updateRuleLocally(ruleType, ruleId, updates) {
        const rules = this.getLocalRules(ruleType);
        const ruleIndex = rules.findIndex(r => r.id === ruleId);
        
        if (ruleIndex !== -1) {
            rules[ruleIndex] = {
                ...rules[ruleIndex],
                ...updates,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem(this.storageKeys[ruleType], JSON.stringify(rules));
            return true;
        }
        
        return false;
    }

    deleteRuleLocally(ruleType, ruleId) {
        const rules = this.getLocalRules(ruleType);
        const filteredRules = rules.filter(r => r.id !== ruleId);
        localStorage.setItem(this.storageKeys[ruleType], JSON.stringify(filteredRules));
    }

    filterRules(rules, filters) {
        return rules.filter(rule => {
            if (filters.category && rule.category !== filters.category) {
                return false;
            }
            if (filters.template_id && rule.template_id !== filters.template_id) {
                return false;
            }
            return true;
        }).slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
    }

    searchLocalRules(rules, searchFilters) {
        return rules.filter(rule => {
            if (searchFilters.category && rule.category !== searchFilters.category) {
                return false;
            }
            if (searchFilters.template_id && rule.template_id !== searchFilters.template_id) {
                return false;
            }
            if (searchFilters.tags && searchFilters.tags.length > 0) {
                const ruleTags = rule.tags || [];
                if (!searchFilters.tags.some(tag => ruleTags.includes(tag))) {
                    return false;
                }
            }
            if (searchFilters.name_contains) {
                const searchTerm = searchFilters.name_contains.toLowerCase();
                const name = (rule.name || '').toLowerCase();
                const description = (rule.description || '').toLowerCase();
                if (!name.includes(searchTerm) && !description.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });
    }

    addToRecentRules(ruleType, rule) {
        try {
            const recentKey = `recent_${this.storageKeys[ruleType]}`;
            const recentRules = JSON.parse(localStorage.getItem(recentKey) || '[]');
            const updatedRecent = [rule, ...recentRules.filter(r => r.id !== rule.id)]
                .slice(0, this.MAX_RECENT_RULES);
            localStorage.setItem(recentKey, JSON.stringify(updatedRecent));
        } catch (error) {
            console.error(`Error updating recent ${ruleType} rules:`, error);
        }
    }

    getRecentRules(ruleType) {
        try {
            const recentKey = `recent_${this.storageKeys[ruleType]}`;
            const rules = localStorage.getItem(recentKey);
            return rules ? JSON.parse(rules) : [];
        } catch (error) {
            console.error(`Error getting recent ${ruleType} rules:`, error);
            return [];
        }
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    getDefaultCategory(ruleType) {
        const categoryMap = {
            delta: 'delta',
            reconciliation: 'reconciliation', 
            transformation: 'transformation'
        };
        return categoryMap[ruleType] || 'general';
    }

    getDefaultCategories(ruleType) {
        const categoryMap = {
            delta: ['delta', 'financial', 'trading', 'data-comparison', 'validation', 'general', 'custom'],
            reconciliation: ['reconciliation', 'financial', 'trading', 'validation', 'general', 'custom'],
            transformation: ['transformation', 'financial', 'trading', 'validation', 'general', 'custom']
        };
        return categoryMap[ruleType] || ['general'];
    }

    getCommonTags(ruleType) {
        const tagsMap = {
            delta: ['key-matching', 'comparison', 'tolerance', 'fuzzy-match', 'exact-match', 'date-matching', 'amount-matching', 'id-matching', 'delta-generation'],
            reconciliation: ['extraction', 'filtering', 'tolerance', 'fuzzy-match', 'exact-match', 'date-matching', 'amount-matching', 'id-matching'],
            transformation: ['transformation', 'merging', 'validation', 'row-generation', 'data-cleaning', 'aggregation']
        };
        return tagsMap[ruleType] || [];
    }

    /**
     * Get statistics for rules
     * @param {Array} rules - Array of rules
     * @returns {Object} - Statistics object
     */
    getRuleStatistics(rules) {
        const stats = {
            total: rules.length,
            by_type: {},
            by_category: {},
            by_template: {},
            total_usage: 0,
            most_used: null,
            recently_created: 0
        };

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        rules.forEach(rule => {
            // Type stats
            const ruleType = rule.rule_type || 'unknown';
            stats.by_type[ruleType] = (stats.by_type[ruleType] || 0) + 1;

            // Category stats
            stats.by_category[rule.category] = (stats.by_category[rule.category] || 0) + 1;

            // Template stats
            if (rule.template_name) {
                stats.by_template[rule.template_name] = (stats.by_template[rule.template_name] || 0) + 1;
            }

            // Usage stats
            const usage = rule.usage_count || 0;
            stats.total_usage += usage;

            if (!stats.most_used || usage > (stats.most_used.usage_count || 0)) {
                stats.most_used = rule;
            }

            // Recent creation stats
            const createdDate = new Date(rule.created_at);
            if (createdDate > weekAgo) {
                stats.recently_created++;
            }
        });

        return stats;
    }

    /**
     * Export rules to JSON file
     * @param {Array} rules - Rules to export
     * @param {string} filename - Optional filename
     * @returns {Object} - {success, error}
     */
    exportRules(rules, filename) {
        try {
            const exportData = {
                version: '1.0',
                exported_at: new Date().toISOString(),
                total_rules: rules.length,
                rules: rules
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `rules_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Error exporting rules:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate rule metadata
     * @param {Object} metadata - Metadata to validate
     * @returns {Object} - {isValid, errors}
     */
    validateRuleMetadata(metadata) {
        const errors = [];

        if (!metadata.name || metadata.name.trim().length < 3) {
            errors.push('Rule name must be at least 3 characters long');
        }

        if (metadata.name && metadata.name.length > 100) {
            errors.push('Rule name must be less than 100 characters');
        }

        if (metadata.description && metadata.description.length > 500) {
            errors.push('Description must be less than 500 characters');
        }

        if (metadata.tags && metadata.tags.length > 10) {
            errors.push('Maximum 10 tags allowed');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Create and export singleton instance
export const unifiedRulesApiService = new UnifiedRulesApiService();
export default unifiedRulesApiService;