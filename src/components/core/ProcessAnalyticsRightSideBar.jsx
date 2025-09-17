import React, { useState, useEffect } from 'react';
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

const ProcessAnalyticsRightSideBar = ({ width = 320 }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'processes'
    const [expandedProcess, setExpandedProcess] = useState(null);

    // Fetch analytics data
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            
            const dashboardData = await analyticsService.getDashboardData();
            
            setAnalyticsData(dashboardData.summary);
            setProcesses(dashboardData.recentProcesses);
            setError(null);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to connect to analytics service');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh analytics data
    useEffect(() => {
        fetchAnalytics();
        
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(fetchAnalytics, 30000);
        
        return () => clearInterval(interval);
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

    if (loading && !analyticsData) {
        return (
            <div className="h-full bg-white border-l border-gray-200 flex items-center justify-center" style={{ width }}>
                <div className="flex flex-col items-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="text-sm text-gray-500">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full bg-white border-l border-gray-200 flex items-center justify-center" style={{ width }}>
                <div className="flex flex-col items-center space-y-2 text-center px-4">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <span className="text-sm text-red-600">{error}</span>
                    <button
                        onClick={fetchAnalytics}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white border-l border-gray-200 flex flex-col" style={{ width }}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Process Analytics</h2>
                    <button
                        onClick={fetchAnalytics}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                            activeTab === 'overview'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('processes')}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                            activeTab === 'processes'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Processes
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
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
            </div>
        </div>
    );
};

export default ProcessAnalyticsRightSideBar;