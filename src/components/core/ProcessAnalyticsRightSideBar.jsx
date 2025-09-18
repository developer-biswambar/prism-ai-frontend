import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import {
    BarChart3,
    Clock,
    Database,
    DollarSign,
    TrendingUp,
    Activity,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Zap,
    Eye,
    Calendar
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import MetricCard from '../analytics/MetricCard';
import SimpleBarChart from '../analytics/SimpleBarChart';

// Global cache to survive StrictMode remounts
const globalState = {
    isInitialized: false,
    analyticsData: null,
    processes: [],
    initPromise: null
};

const ProcessAnalyticsRightSideBar = () => {
    const [analyticsData, setAnalyticsData] = useState(globalState.analyticsData);
    const [processes, setProcesses] = useState(globalState.processes);
    const [loading, setLoading] = useState(!globalState.isInitialized);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'processes'
    const [expandedProcess, setExpandedProcess] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(globalState.isInitialized);
    const sidebarRef = useRef(null);
    const isFirstMount = useRef(true);
    
    // Fixed width - no resizing functionality
    const width = 320;
    
    // Only log on mount and major state changes
    useEffect(() => {
        console.log('🔍 ProcessAnalyticsRightSideBar MOUNTED/STATE CHANGE:', {
            hasInitialized,
            loading,
            analyticsData: !!analyticsData,
            timestamp: new Date().toISOString()
        });
    }, [hasInitialized, loading, analyticsData]);

    // Comprehensive DOM monitoring with ResizeObserver
    useLayoutEffect(() => {
        if (sidebarRef.current) {
            const element = sidebarRef.current;
            
            // Initial measurement
            const rect = element.getBoundingClientRect();
            console.log('📐 ProcessAnalyticsRightSideBar INITIAL DOM MEASUREMENT:', {
                actualWidth: rect.width,
                expectedWidth: width,
                widthDifference: rect.width - width,
                offsetWidth: element.offsetWidth,
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                computedWidth: window.getComputedStyle(element).width,
                hasInitialized,
                timestamp: new Date().toISOString()
            });

            // Set up ResizeObserver to track all size changes
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width: observedWidth, height } = entry.contentRect;
                    console.log('🔍 RESIZE OBSERVER - Right Sidebar size changed:', {
                        observedWidth,
                        height,
                        expectedWidth: width,
                        widthDifference: observedWidth - width,
                        hasInitialized,
                        loading,
                        timestamp: new Date().toISOString(),
                        trigger: 'ResizeObserver'
                    });
                }
            });

            resizeObserver.observe(element);

            // Also monitor parent container
            const parentElement = element.parentElement;
            if (parentElement) {
                console.log('📐 Parent container measurement:', {
                    parentWidth: parentElement.offsetWidth,
                    parentDisplay: window.getComputedStyle(parentElement).display,
                    parentGrid: window.getComputedStyle(parentElement).gridTemplateColumns,
                    timestamp: new Date().toISOString()
                });

                const parentResizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        const { width: parentWidth } = entry.contentRect;
                        console.log('🔍 RESIZE OBSERVER - Parent container changed:', {
                            parentWidth,
                            timestamp: new Date().toISOString(),
                            trigger: 'ParentResizeObserver'
                        });
                    }
                });

                parentResizeObserver.observe(parentElement);

                return () => {
                    resizeObserver.disconnect();
                    parentResizeObserver.disconnect();
                };
            }

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [hasInitialized, loading, width]);

    // StrictMode-safe analytics fetching
    const fetchAnalytics = async (forceRefresh = false) => {
        // If we already have a fetch in progress, wait for it
        if (!forceRefresh && globalState.initPromise) {
            console.log('🔄 ProcessAnalyticsRightSideBar: Waiting for existing fetch...');
            return await globalState.initPromise;
        }

        // If already initialized and not forcing refresh, use cached data
        if (!forceRefresh && globalState.isInitialized) {
            console.log('🔄 ProcessAnalyticsRightSideBar: Using cached data');
            setAnalyticsData(globalState.analyticsData);
            setProcesses(globalState.processes);
            setLoading(false);
            setHasInitialized(true);
            return;
        }

        // Create the fetch promise and store it globally
        globalState.initPromise = (async () => {
            try {
                console.log('🔄 ProcessAnalyticsRightSideBar: Starting fresh fetch analytics', { 
                    forceRefresh, 
                    hasInitialized, 
                    currentWidth: width,
                    timestamp: new Date().toISOString()
                });
                setLoading(true);
                
                const [summary, processes] = await Promise.all([
                    analyticsService.getAnalyticsSummary('default_user', forceRefresh),
                    analyticsService.getUserProcesses({ 
                        userId: 'default_user', 
                        limit: 20,
                        forceRefresh 
                    })
                ]);
                
                console.log('✅ ProcessAnalyticsRightSideBar: Analytics data loaded', {
                    summary: !!summary,
                    processesCount: processes?.processes?.length || 0,
                    timestamp: new Date().toISOString()
                });
                
                // Update global state
                globalState.analyticsData = summary;
                globalState.processes = processes.processes || [];
                globalState.isInitialized = true;
                
                // Update component state
                setAnalyticsData(summary);
                setProcesses(processes.processes || []);
                setError(null);
                setLoading(false);
                setHasInitialized(true);
                
                console.log('📊 ProcessAnalyticsRightSideBar: Global and component state updated');
                
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError('Failed to connect to analytics service');
                setLoading(false);
            } finally {
                // Clear the promise so future calls can start fresh
                globalState.initPromise = null;
            }
        })();

        return await globalState.initPromise;
    };

    // Auto-refresh analytics data with StrictMode cleanup
    useEffect(() => {
        fetchAnalytics();
        
        // Set up auto-refresh every 2 minutes instead of 30 seconds
        const interval = setInterval(() => fetchAnalytics(true), 120000);
        
        return () => {
            clearInterval(interval);
            // In StrictMode, components may unmount and remount
            // Don't clear global state as it should persist across mounts
            console.log('🔄 ProcessAnalyticsRightSideBar: Component unmounting (likely StrictMode)');
        };
    }, []);

    // Monitor browser paint and layout events
    useEffect(() => {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.entryType === 'layout-shift' && entry.value > 0) {
                        console.log('⚡ LAYOUT SHIFT DETECTED:', {
                            value: entry.value,
                            sources: entry.sources?.map(s => ({
                                node: s.node?.tagName,
                                rect: s.currentRect
                            })),
                            timestamp: entry.startTime,
                            trigger: 'LayoutShift'
                        });
                    }
                    if (entry.entryType === 'paint') {
                        console.log('🎨 PAINT EVENT:', {
                            name: entry.name,
                            startTime: entry.startTime,
                            duration: entry.duration,
                            trigger: 'Paint'
                        });
                    }
                });
            });

            try {
                observer.observe({ entryTypes: ['layout-shift', 'paint'] });
            } catch (e) {
                console.log('Performance observer not supported:', e.message);
            }

            return () => observer.disconnect();
        }
    }, []);

    // Use analytics service helper methods
    const formatCurrency = analyticsService.formatCurrency;
    const formatTime = analyticsService.formatTime;
    const formatDate = analyticsService.formatDate;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getProcessTypeColor = analyticsService.getProcessTypeColor;


    // Single unified render with consistent DOM structure to prevent layout shifts
    const isLoading = !hasInitialized || (loading && !analyticsData);
    
    console.log('🎭 RENDERING: Unified render state', {
        hasInitialized,
        loading,
        isLoading,
        hasData: !!analyticsData,
        timestamp: new Date().toISOString()
    });

    if (error) {
        return (
            <div 
                ref={sidebarRef}
                className="h-full bg-white border-l border-gray-200 flex flex-col flex-shrink-0" 
                style={{ width, minWidth: width, maxWidth: width }}
            >
                {/* Header - maintain same structure as loaded state */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Process Analytics</h2>
                        <button
                            onClick={() => fetchAnalytics(true)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Retry loading analytics"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Tab Navigation - disabled */}
                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                        <div className="flex-1 py-1.5 px-3 text-xs font-medium rounded-md bg-white shadow-sm text-gray-400">
                            Overview
                        </div>
                        <div className="flex-1 py-1.5 px-3 text-xs font-medium rounded-md text-gray-400">
                            Processes
                        </div>
                    </div>
                </div>

                {/* Content - error state */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2 text-center px-4">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <span className="text-sm text-red-600">{error}</span>
                        <button
                            onClick={() => fetchAnalytics(true)}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={sidebarRef}
            className="h-full bg-white border-l border-gray-200 flex flex-col flex-shrink-0" 
            style={{ width, minWidth: width, maxWidth: width }}
        >
            {/* Header - Always consistent structure */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Process Analytics</h2>
                    <button
                        onClick={() => fetchAnalytics(true)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                        title="Refresh analytics data"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                {/* Tab Navigation - Always present with consistent structure */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => !isLoading && setActiveTab('overview')}
                        disabled={isLoading}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                            activeTab === 'overview' && !isLoading
                                ? 'bg-white text-gray-900 shadow-sm'
                                : isLoading
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => !isLoading && setActiveTab('processes')}
                        disabled={isLoading}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                            activeTab === 'processes' && !isLoading
                                ? 'bg-white text-gray-900 shadow-sm'
                                : isLoading
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Processes
                    </button>
                </div>
            </div>

            {/* Content - Single consistent container with conditional content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    // Loading skeleton with exact same structure as real content
                    <div className="p-4 space-y-4">
                        {activeTab === 'overview' ? (
                            <>
                                {/* Skeleton for overview content - matches real content structure exactly */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Skeleton for additional sections - matches real content */}
                                <div className="bg-gray-50 p-3 rounded-lg animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded-lg animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                                
                                {/* Loading indicator */}
                                <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-2" />
                                    <span className="text-xs text-gray-500">Loading analytics...</span>
                                </div>
                            </>
                        ) : (
                            // Skeleton for processes tab
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-2" />
                                    <span className="text-xs text-gray-500">Loading processes...</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Actual content - only show when fully loaded
                    <>
                        {activeTab === 'overview' && analyticsData && (
                            <div className="p-4 space-y-4">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <MetricCard
                                        title="Total Processes"
                                        value={analyticsData.total_processes}
                                        icon={Activity}
                                        color="blue"
                                    />
                                    
                                    <MetricCard
                                        title="Success Rate"
                                        value={`${analyticsData.success_rate}%`}
                                        icon={TrendingUp}
                                        color="green"
                                        trend={analyticsData.success_rate >= 90 ? 'up' : analyticsData.success_rate >= 70 ? 'neutral' : 'down'}
                                    />
                                    
                                    <MetricCard
                                        title="Total Cost"
                                        value={formatCurrency(analyticsData.total_estimated_cost_usd)}
                                        icon={DollarSign}
                                        color="purple"
                                        subtitle="AI Processing"
                                    />
                                    
                                    <MetricCard
                                        title="Avg Time"
                                        value={formatTime(analyticsData.avg_processing_time_seconds)}
                                        icon={Clock}
                                        color="orange"
                                        subtitle="Per Process"
                                    />
                                </div>

                                {/* Data Processing Stats */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                        <Database className="w-4 h-4 mr-2" />
                                        Data Processing
                                    </h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Input Rows:</span>
                                            <span className="font-medium">{analyticsData.total_input_rows.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Output Rows:</span>
                                            <span className="font-medium">{analyticsData.total_output_rows.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Processing Time:</span>
                                            <span className="font-medium">{formatTime(analyticsData.total_processing_time_seconds)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Token Usage Stats */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                        <Zap className="w-4 h-4 mr-2" />
                                        Token Usage
                                    </h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Tokens:</span>
                                            <span className="font-medium">{analyticsData.total_tokens_used.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Avg Cost/Process:</span>
                                            <span className="font-medium">{formatCurrency(analyticsData.avg_cost_per_process)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Process Type Breakdown */}
                                {Object.keys(analyticsData.process_type_breakdown).length > 0 && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Process Types
                                        </h3>
                                        <SimpleBarChart
                                            data={Object.entries(analyticsData.process_type_breakdown).map(([type, count]) => ({
                                                label: type.replace('_', ' '),
                                                value: count
                                            }))}
                                            height={80}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'processes' && (
                            <div className="space-y-3 p-4">
                                {processes.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No processes found</p>
                                    </div>
                                ) : (
                                    processes.map((process) => (
                                        <div key={process.SK} className="bg-white border border-gray-200 rounded-lg p-3">
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => setExpandedProcess(
                                                    expandedProcess === process.SK ? null : process.SK
                                                )}
                                            >
                                                <div className="flex items-center space-x-2 flex-1">
                                                    {getStatusIcon(process.status)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {process.process_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(process.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {expandedProcess === process.SK ? 
                                                    <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                }
                                            </div>

                                            {expandedProcess === process.SK && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-gray-500">Input Rows:</span>
                                                            <span className="ml-1 font-medium">{process.input_row_count}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Output Rows:</span>
                                                            <span className="ml-1 font-medium">{process.output_row_count}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Time:</span>
                                                            <span className="ml-1 font-medium">
                                                                {formatTime(process.processing_time_seconds)}
                                                            </span>
                                                        </div>
                                                        {process.confidence_score && (
                                                            <div>
                                                                <span className="text-gray-500">Confidence:</span>
                                                                <span className="ml-1 font-medium">{process.confidence_score}%</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {process.token_usage && (
                                                        <div className="bg-blue-50 p-2 rounded text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-blue-600">Tokens:</span>
                                                                <span className="font-medium">{process.token_usage.total_tokens}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-blue-600">Cost:</span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(process.token_usage.estimated_cost_usd)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {process.error_info && (
                                                        <div className="bg-red-50 p-2 rounded text-xs">
                                                            <p className="text-red-600 font-medium">Error:</p>
                                                            <p className="text-red-700">{process.error_info.error_message}</p>
                                                        </div>
                                                    )}

                                                    {process.user_prompt && (
                                                        <div className="bg-gray-50 p-2 rounded text-xs">
                                                            <p className="text-gray-600 font-medium">Prompt:</p>
                                                            <p className="text-gray-700 truncate">{process.user_prompt}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProcessAnalyticsRightSideBar;