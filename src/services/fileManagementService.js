// src/services/fileManagementService.js
import {apiService} from './defaultApi.js';

class FileManagementService {
    constructor() {
        this.cache = new Map();
    }

    // File operations
    async uploadFile(file, onProgress = null) {
        try {
            const data = await apiService.uploadFile(file, onProgress);
            if (data.success) {
                this.invalidateCache('files');

                // Add the new file immediately to avoid cache issues
                const newFile = {
                    ...data.data,
                    isNew: true, // Flag for animation
                    uploadedAt: Date.now()
                };

                return {
                    success: true,
                    file: newFile,
                    message: `File "${file.name}" uploaded successfully!`,
                    fileData: data.data // Raw file data for immediate display
                };
            }
            return {success: false, error: data.message};
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message
            };
        }
    }

    async getFiles() {
        try {
            console.log('🔄 [fileManagementService] getFiles called');
            // if (this.cache.has('files')) {
            //     return this.cache.get('files');
            // }

            console.log('🔄 [fileManagementService] Calling apiService.getFiles...');
            const data = await apiService.getFiles();
            console.log('📁 [fileManagementService] apiService.getFiles response:', data);
            
            if (data.success) {
                const result = {success: true, files: data.data.files || []};
                console.log('✅ [fileManagementService] Parsed', result.files.length, 'files from API response');
                this.cache.set('files', result);
                return result;
            }
            console.log('❌ [fileManagementService] API response not successful:', data.message);
            return {success: false, files: [], error: data.message};
        } catch (error) {
            console.error('❌ [fileManagementService] Failed to load files:', error);
            return {success: false, files: [], error: error.message};
        }
    }

    async deleteFile(fileId) {
        try {
            const data = await apiService.deleteFile(fileId);
            if (data.success) {
                this.invalidateCache('files');
                return {success: true, message: 'File deleted successfully'};
            }
            return {success: false, error: data.message};
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message
            };
        }
    }

    // Template operations
    async getTemplates() {
        try {
            if (this.cache.has('templates')) {
                return this.cache.get('templates');
            }

            const response = await apiService.getReconciliationTemplates();
            const result = {success: true, templates: response.data || []};
            this.cache.set('templates', result);
            return result;
        } catch (error) {
            console.error('Failed to load templates:', error);
            return {success: false, templates: [], error: error.message};
        }
    }

    // Cache management
    invalidateCache(key) {
        console.log('🗑️ [fileManagementService] invalidateCache called with key:', key);
        if (key) {
            console.log('🗑️ [fileManagementService] Deleting cache entry for key:', key);
            this.cache.delete(key);
        } else {
            console.log('🗑️ [fileManagementService] Clearing all cache');
            this.cache.clear();
        }
        console.log('🗑️ [fileManagementService] Cache size after invalidation:', this.cache.size);
    }

    // File validation
    validateFileSelection(selectedFiles, requiredFiles) {
        if (!requiredFiles || requiredFiles.length === 0) {
            return {valid: false, error: 'No file requirements defined'};
        }

        const missingFiles = requiredFiles.filter(rf => !selectedFiles[rf.key]);
        if (missingFiles.length > 0) {
            return {
                valid: false,
                error: `Missing files: ${missingFiles.map(f => f.label).join(', ')}`
            };
        }

        return {valid: true};
    }

    // File requirement setup
    setupFileRequirements(template) {
        if (!template) return [];

        const fileRequirements = [];

        // For miscellaneous/data-analysis, allow up to maxFiles selection
        if (template.category === 'miscellaneous' || template.category === 'data-analysis') {
            const maxFiles = template.maxFiles || 5;
            for (let i = 0; i < maxFiles; i++) {
                fileRequirements.push({
                    key: `file_${i}`,
                    label: i < template.fileLabels.length ? template.fileLabels[i] : `Data File ${i + 1}`,
                    selected: null,
                    required: i < template.filesRequired // Only first file is required
                });
            }
        } else {
            // For other templates, use the original logic
            for (let i = 0; i < template.filesRequired; i++) {
                fileRequirements.push({
                    key: `file_${i}`,
                    label: template.fileLabels[i] || `File ${i + 1}`,
                    selected: null,
                    required: true
                });
            }
        }

        return fileRequirements;
    }
}

export const fileManagementService = new FileManagementService();