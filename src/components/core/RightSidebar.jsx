import React from 'react';
import {Activity, BarChart3, Clock, Database, DollarSign, Target, TrendingUp, Zap, ArrowUpDown, FileText, Star, Brain, Cpu, Search} from 'lucide-react';

const RightSidebar = ({
                                analyticsData,
                                processes,
                                loading,
                                error,
                                onRefresh
                            }) => {
    const width = 320;
    
    // Function to get process type display name and icon
    const getProcessTypeInfo = (process) => {
        const processId = process.process_id || '';
        
        // Determine process type from process_id prefix or process_type field
        if (processId.startsWith('data_analysis_') || process.process_type === 'data_analysis') {
            return {
                name: 'Data Analysis',
                icon: <Brain size={14} className="text-purple-600" />,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50'
            };
        } else if (processId.startsWith('recon_') || process.process_type === 'reconciliation') {
            return {
                name: 'Reconciliation',
                icon: <Target size={14} className="text-blue-600" />,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            };
        } else if (processId.startsWith('transform_') || process.process_type === 'transformation') {
            return {
                name: 'Transformation',
                icon: <Cpu size={14} className="text-green-600" />,
                color: 'text-green-600',
                bgColor: 'bg-green-50'
            };
        } else if (process.process_type === 'analysis') {
            return {
                name: 'Analysis',
                icon: <Search size={14} className="text-orange-600" />,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50'
            };
        } else {
            return {
                name: 'Data Processing',
                icon: <Activity size={14} className="text-gray-600" />,
                color: 'text-gray-600',
                bgColor: 'bg-gray-50'
            };
        }
    };

    return (
        <div
            className="bg-white border-l border-gray-200 flex flex-col overflow-hidden"
            style={{
                width: `${width}px`,
                minWidth: `${width}px`,
                maxWidth: `${width}px`
            }}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <BarChart3 size={20} className="text-blue-600"/>
                        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                        >
                            Refresh
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">Process statistics and insights</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div
                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading analytics...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-red-600 mb-4">{error}</p>
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        {analyticsData && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Summary</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <Activity size={16} className="text-blue-600 mr-2"/>
                                            <div>
                                                <p className="text-xs text-blue-600">Total Processes</p>
                                                <p className="text-lg font-semibold text-blue-900">
                                                    {analyticsData.total_processes || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <TrendingUp size={16} className="text-green-600 mr-2"/>
                                            <div>
                                                <p className="text-xs text-green-600">Success Rate</p>
                                                <p className="text-lg font-semibold text-green-900">
                                                    {analyticsData.success_rate ? `${analyticsData.success_rate}%` : '0%'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <DollarSign size={16} className="text-purple-600 mr-2"/>
                                            <div>
                                                <p className="text-xs text-purple-600">Total Cost</p>
                                                <p className="text-lg font-semibold text-purple-900">
                                                    ${analyticsData.total_estimated_cost_usd ? Number(analyticsData.total_estimated_cost_usd).toFixed(4) : '0.0000'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <Zap size={16} className="text-orange-600 mr-2"/>
                                            <div>
                                                <p className="text-xs text-orange-600">Tokens Used</p>
                                                <p className="text-lg font-semibold text-orange-900">
                                                    {analyticsData.total_tokens_used ? Number(analyticsData.total_tokens_used).toLocaleString() : '0'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Processes */}
                        {processes && processes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Processes</h3>
                                <div className="space-y-2">
                                    {processes.slice(0, 5).map((process, index) => {
                                        const typeInfo = getProcessTypeInfo(process);
                                        return (
                                        <div key={index} className={`${typeInfo.bgColor} p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        {typeInfo.icon}
                                                        <p className={`text-sm font-medium ${typeInfo.color} truncate`}>
                                                            {typeInfo.name}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {process.created_at ? new Date(process.created_at).toLocaleString() : 'Recent'}
                                                    </p>
                                                    {process.process_id && (
                                                        <p className="text-xs text-gray-400 font-mono truncate" title={process.process_id}>
                                                            ID: {process.process_id.slice(-12)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                    process.status === 'completed'
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : process.status === 'failed'
                                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                }`}>
                                                    {process.status || 'completed'}
                                                </div>
                                            </div>
                                            {/* Additional Process Details */}
                                            <div className="space-y-2 mt-2">
                                                {/* Row counts and confidence */}
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {process.input_row_count !== undefined && (
                                                        <div className="flex items-center text-indigo-600">
                                                            <ArrowUpDown size={10} className="mr-1"/>
                                                            <span>Input rows: {Number(process.input_row_count).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    {process.output_row_count !== undefined && (
                                                        <div className="flex items-center text-emerald-600">
                                                            <FileText size={10} className="mr-1"/>
                                                            <span>Output rows: {Number(process.output_row_count).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Confidence and processing time */}
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {process.confidence_score !== undefined && (
                                                        <div className="flex items-center text-gray-600">
                                                            <Star size={10} className="mr-1"/>
                                                            <span>Conf: {process.confidence_score.toFixed(1)}%</span>
                                                        </div>
                                                    )}
                                                    {process.processing_time_seconds !== undefined && (
                                                        <div className="flex items-center text-gray-600">
                                                            <Clock size={10} className="mr-1"/>
                                                            <span>{process.processing_time_seconds.toFixed(1)}s</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Token usage and cost */}
                                                {(process.token_usage || process.processing_time_seconds) && (
                                                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-200">
                                                        {process.token_usage?.total_tokens && (
                                                            <span className="flex items-center">
                                                                <Zap size={10} className="mr-1"/>
                                                                {Number(process.token_usage.total_tokens).toLocaleString()} tokens
                                                            </span>
                                                        )}
                                                        {process.token_usage?.estimated_cost_usd && (
                                                            <span className="flex items-center">
                                                                <DollarSign size={10} className="mr-1"/>
                                                                ${Number(process.token_usage.estimated_cost_usd).toFixed(4)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {(!analyticsData || analyticsData.total_processes === 0) && (!processes || processes.length === 0) && (
                            <div className="text-center py-8">
                                <BarChart3 size={48} className="mx-auto text-gray-300 mb-4"/>
                                <p className="text-sm text-gray-500 mb-2">No analytics data yet</p>
                                <p className="text-xs text-gray-400">Start processing files to see insights</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSidebar;