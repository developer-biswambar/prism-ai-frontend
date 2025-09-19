// src/hooks/useAppState.js
import {useCallback, useEffect, useState} from 'react';
import {fileManagementService} from '../services/fileManagementService';

export const useFileManagement = () => {
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(false);

    const loadFiles = useCallback(async () => {
        console.log('🔄 [useFileManagement] loadFiles called');
        const result = await fileManagementService.getFiles();
        console.log('📁 [useFileManagement] fileManagementService.getFiles result:', result);
        if (result.success) {
            console.log('✅ [useFileManagement] Setting files:', result.files.length, 'files');
            setFiles(result.files);
        } else {
            console.log('❌ [useFileManagement] getFiles failed:', result.error);
        }
        return result;
    }, []);

    const uploadFile = useCallback(async (file) => {
        setUploadProgress(true);

        const result = await fileManagementService.uploadFile(file);

        if (result.success) {
            // Immediately refresh file list after successful upload
            await loadFiles();
        }

        setUploadProgress(false);
        return result;
    }, [loadFiles]);

    const deleteFile = useCallback(async (fileId) => {
        const result = await fileManagementService.deleteFile(fileId);
        if (result.success) {
            await loadFiles(); // Refresh file list
        }
        return result;
    }, [loadFiles]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    return {
        files,
        uploadProgress,
        loadFiles,
        uploadFile,
        deleteFile
    };
};


export const usePanelResize = () => {
    // Fixed panel widths - no resizing functionality
    const leftPanelWidth = 320;
    const rightPanelWidth = 320;

    return {
        leftPanelWidth,
        rightPanelWidth,
        isResizing: null,
        setIsResizing: () => {
        }, // No-op function for compatibility
        isInitialized: true
    };
};

export const useDocumentTitle = (
    isProcessing,
    activeProcess,
    uploadProgress,
    selectedFiles
) => {
    useEffect(() => {
        let title = 'Financial Reconciliation Chat';

        if (isProcessing && activeProcess) {
            title = '🔄 Processing...';
        } else if (uploadProgress) {
            title = '📤 Uploading File...';
        } else if (selectedFiles.fileA && selectedFiles.fileB) {
            title = '✅ Ready to Process';
        }

        document.title = title;

        return () => {
            document.title = 'Financial Reconciliation Chat';
        };
    }, [isProcessing, activeProcess, uploadProgress, selectedFiles]);
};

export const useAnalyticsManagement = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAnalytics = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            // Import and use the real analytics service
            const analyticsService = await import('../services/analyticsService');
            const service = analyticsService.default;

            const [summary, processesData] = await Promise.all([
                service.getAnalyticsSummary('default_user', forceRefresh),
                service.getUserProcesses({
                    userId: 'default_user',
                    limit: 20,
                    forceRefresh
                })
            ]);

            setAnalyticsData(summary);
            setProcesses(processesData.processes || []);

        } catch (err) {
            console.error('Error loading analytics:', err);
            setError('Failed to connect to analytics service');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAnalytics();

        // Set up auto-refresh every 2 minutes
        const interval = setInterval(() => loadAnalytics(true), 120000);

        return () => clearInterval(interval);
    }, [loadAnalytics]);

    return {
        analyticsData,
        processes,
        loading,
        error,
        loadAnalytics
    };
};

