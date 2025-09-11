/**
 * Use Case Detail Modal Component
 * Displays comprehensive information about a use case including metadata, configuration, and execution details
 */

import React, { useState } from 'react';
import {
    X,
    Eye,
    FileText,
    Settings,
    Database,
    Calendar,
    Users,
    Star,
    Tag,
    Clock,
    Brain,
    Code,
    Layers,
    CheckCircle,
    Activity,
    ExternalLink,
    Copy,
    Trash2,
    Edit,
    Play,
    AlertCircle,
    Info,
    TrendingUp,
    BarChart3,
    Sparkles
} from 'lucide-react';
import { useCaseService } from '../../services/useCaseService';

const UseCaseDetailModal = ({ 
    isOpen, 
    onClose, 
    useCase,
    onEdit = null,
    onDelete = null,
    onDuplicate = null,
    onApply = null 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isApplying, setIsApplying] = useState(false);

    if (!isOpen || !useCase) return null;

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Unknown';
        }
    };

    const getUseCaseTypeColor = (type) => {
        const colors = {
            'reconciliation': 'bg-blue-100 text-blue-800 border-blue-200',
            'analysis': 'bg-green-100 text-green-800 border-green-200',
            'transformation': 'bg-purple-100 text-purple-800 border-purple-200',
            'reporting': 'bg-orange-100 text-orange-800 border-orange-200',
            'data_processing': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[type] || colors['data_processing'];
    };

    const renderStars = (rating, ratingCount) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={16}
                    className={i <= Math.round(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                />
            );
        }
        return (
            <div className="flex items-center space-x-1">
                <div className="flex items-center">
                    {stars}
                </div>
                {ratingCount > 0 && (
                    <span className="text-sm text-gray-500 ml-2">({ratingCount} rating{ratingCount !== 1 ? 's' : ''})</span>
                )}
            </div>
        );
    };

    const handleApply = async () => {
        if (!onApply) return;
        
        try {
            setIsApplying(true);
            await onApply(useCase);
        } catch (error) {
            console.error('Failed to apply use case:', error);
        } finally {
            setIsApplying(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'configuration', label: 'Configuration', icon: Settings },
        { id: 'execution', label: 'Execution Details', icon: Database },
        { id: 'metadata', label: 'Metadata', icon: Info },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ];

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="text-blue-500" size={20} />
                    <span>Basic Information</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-gray-900">{useCase.name}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <p className="text-gray-900">{useCase.category}</p>
                    </div>
                    
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{useCase.description}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUseCaseTypeColor(useCase.use_case_type)}`}>
                            {useCaseService.formatUseCaseTypeDisplay(useCase.use_case_type)}
                        </span>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                        <p className="text-gray-900">{useCase.created_by || 'Anonymous'}</p>
                    </div>
                </div>
                
                {/* Tags */}
                {useCase.tags && useCase.tags.length > 0 && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {useCase.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded"
                                >
                                    <Tag size={12} className="mr-1" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Use Case Content */}
            {useCase.use_case_content && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                        <Sparkles className="text-blue-500" size={20} />
                        <span>Use Case Content</span>
                    </h3>
                    <div className="bg-white p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{useCase.use_case_content}</pre>
                    </div>
                </div>
            )}

            {/* Performance Stats */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <TrendingUp className="text-green-500" size={20} />
                    <span>Performance</span>
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{useCase.usage_count || 0}</div>
                        <div className="text-sm text-gray-600">Usage Count</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{useCase.rating?.toFixed(1) || '0.0'}</div>
                        <div className="text-sm text-gray-600">Rating</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{useCase.rating_count || 0}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{useCase.version || '1.0'}</div>
                        <div className="text-sm text-gray-600">Version</div>
                    </div>
                </div>
                
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    {renderStars(useCase.rating || 0, useCase.rating_count || 0)}
                </div>
            </div>
        </div>
    );

    const renderConfigurationTab = () => (
        <div className="space-y-6">
            {useCase.use_case_config && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Settings className="text-purple-500" size={20} />
                        <span>Configuration</span>
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-800 overflow-x-auto">
                            {JSON.stringify(useCase.use_case_config, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Template Configuration (Smart Execution) */}
            {useCase.use_case_config?.primary_sql && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                        <Database className="text-blue-500" size={20} />
                        <span>Smart Execution SQL</span>
                    </h3>
                    
                    <div className="bg-white p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-x-auto">
                            {useCase.use_case_config.primary_sql}
                        </pre>
                    </div>
                </div>
            )}

            {/* Expected File Schemas */}
            {useCase.use_case_config?.expected_file_schemas && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
                        <Layers className="text-green-500" size={20} />
                        <span>Expected File Schemas</span>
                    </h3>
                    
                    <div className="space-y-4">
                        {useCase.use_case_config.expected_file_schemas.map((schema, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg">
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">File Pattern:</span>
                                    <span className="ml-2 text-gray-900">{schema.filename_pattern}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">Required Columns:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {schema.required_columns?.map(col => (
                                            <span key={col} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderExecutionTab = () => (
        <div className="space-y-6">
            {/* Execution Strategy */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Activity className="text-indigo-500" size={20} />
                    <span>Execution Strategy</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Execution Method</label>
                        <p className="text-gray-900 capitalize">
                            {useCase.use_case_config?.execution_method || 'Standard'}
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Strategy</label>
                        <p className="text-gray-900 capitalize">
                            {useCase.use_case_config?.fallback_strategy || 'None'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Reliability Metrics */}
            {useCase.use_case_config?.reliability_metrics && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
                        <CheckCircle className="text-green-500" size={20} />
                        <span>Reliability Metrics</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-xl font-bold text-green-600">
                                {useCase.use_case_config.reliability_metrics.tested_with_files || 0}
                            </div>
                            <div className="text-sm text-gray-600">Files Tested</div>
                        </div>
                        
                        <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                                {useCase.use_case_config.reliability_metrics.successful_execution ? 'Yes' : 'No'}
                            </div>
                            <div className="text-sm text-gray-600">Last Success</div>
                        </div>
                        
                        <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-xs text-purple-600">
                                {useCase.use_case_config.reliability_metrics.last_successful_execution 
                                    ? formatDate(useCase.use_case_config.reliability_metrics.last_successful_execution)
                                    : 'Never'
                                }
                            </div>
                            <div className="text-sm text-gray-600">Last Execution</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Column Mapping */}
            {useCase.use_case_config?.column_mapping && Object.keys(useCase.use_case_config.column_mapping).length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Code className="text-orange-500" size={20} />
                        <span>Column Mapping</span>
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-800 overflow-x-auto">
                            {JSON.stringify(useCase.use_case_config.column_mapping, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMetadataTab = () => (
        <div className="space-y-6">
            {/* Basic Metadata */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calendar className="text-blue-500" size={20} />
                    <span>Timestamps</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <p className="text-gray-900 text-sm">{formatDate(useCase.created_at)}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-gray-900 text-sm">{formatDate(useCase.updated_at)}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Used</label>
                        <p className="text-gray-900 text-sm">
                            {useCase.last_used_at ? formatDate(useCase.last_used_at) : 'Never'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rich Metadata */}
            {useCase.use_case_metadata && (
                <div className="space-y-6">
                    {/* Original vs Ideal Prompt */}
                    {(useCase.use_case_metadata.original_prompt || useCase.use_case_metadata.ideal_prompt) && (
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                                <Brain className="text-blue-500" size={20} />
                                <span>Prompt Evolution</span>
                            </h3>
                            
                            {useCase.use_case_metadata.original_prompt && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-blue-700 mb-2">Original Prompt</label>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-sm text-gray-800">{useCase.use_case_metadata.original_prompt}</p>
                                    </div>
                                </div>
                            )}
                            
                            {useCase.use_case_metadata.ideal_prompt && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-blue-700 mb-2">AI-Optimized Prompt</label>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-sm text-gray-800">{useCase.use_case_metadata.ideal_prompt}</p>
                                    </div>
                                </div>
                            )}
                            
                            {useCase.use_case_metadata.improvements_made && (
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">AI Improvements</label>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-sm text-gray-800">{useCase.use_case_metadata.improvements_made}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Processing Context */}
                    {useCase.use_case_metadata.processing_context && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                <Database className="text-purple-500" size={20} />
                                <span>Processing Context</span>
                            </h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Query Type</label>
                                    <p className="text-gray-900 capitalize">
                                        {useCase.use_case_metadata.processing_context.query_type}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Column Count</label>
                                    <p className="text-gray-900">
                                        {useCase.use_case_metadata.processing_context.column_count}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Row Count</label>
                                    <p className="text-gray-900">
                                        {useCase.use_case_metadata.processing_context.row_count}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Smart Execution</label>
                                    <p className="text-gray-900">
                                        {useCase.use_case_metadata.smart_execution_compatible ? 'Compatible' : 'Not Compatible'}
                                    </p>
                                </div>
                            </div>
                            
                            {useCase.use_case_metadata.processing_context.generated_sql && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Generated SQL</label>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <pre className="text-sm text-gray-800 font-mono overflow-x-auto">
                                            {useCase.use_case_metadata.processing_context.generated_sql}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* File Schemas */}
                    {useCase.use_case_metadata.file_schemas && useCase.use_case_metadata.file_schemas.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                <Layers className="text-green-500" size={20} />
                                <span>Original File Schemas</span>
                            </h3>
                            
                            <div className="space-y-4">
                                {useCase.use_case_metadata.file_schemas.map((schema, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-700">Filename:</span>
                                            <span className="ml-2 text-gray-900">{schema.filename}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-700">Columns:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {schema.columns?.map(col => (
                                                    <span key={col} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                                        {col}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Total Rows:</span>
                                            <span className="ml-2 text-gray-900">{schema.totalRows || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderAnalyticsTab = () => (
        <div className="space-y-6">
            {/* Usage Analytics */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <BarChart3 className="text-green-500" size={20} />
                    <span>Usage Analytics</span>
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{useCase.usage_count || 0}</div>
                        <div className="text-sm text-gray-600">Total Uses</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{(useCase.rating || 0).toFixed(1)}</div>
                        <div className="text-sm text-gray-600">Avg Rating</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{useCase.rating_count || 0}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {useCase.use_case_metadata?.smart_execution_compatible ? 'Yes' : 'No'}
                        </div>
                        <div className="text-sm text-gray-600">Smart Exec</div>
                    </div>
                </div>
                
                {/* Success Metrics */}
                {useCase.use_case_metadata?.success_metrics && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className={`${useCase.use_case_metadata.success_metrics.has_results ? 'text-green-500' : 'text-gray-300'}`} size={16} />
                            <span className="text-sm">Has Results</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <CheckCircle className={`${useCase.use_case_metadata.success_metrics.execution_success ? 'text-green-500' : 'text-gray-300'}`} size={16} />
                            <span className="text-sm">Execution Success</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Activity className="text-blue-500" size={16} />
                            <span className="text-sm">Process ID: {useCase.use_case_metadata.success_metrics.process_id || 'N/A'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Performance Indicators */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <TrendingUp className="text-purple-500" size={20} />
                    <span>Performance Indicators</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Reliability Score</h4>
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ 
                                        width: `${Math.min((useCase.rating || 0) * 20, 100)}%` 
                                    }}
                                ></div>
                            </div>
                            <span className="text-sm text-gray-600">{((useCase.rating || 0) * 20).toFixed(0)}%</span>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Adoption Rate</h4>
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ 
                                        width: `${Math.min(((useCase.usage_count || 0) / 10) * 100, 100)}%` 
                                    }}
                                ></div>
                            </div>
                            <span className="text-sm text-gray-600">{Math.min(((useCase.usage_count || 0) / 10) * 100, 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">
                                {useCaseService.getUseCaseTypeIcon(useCase.use_case_type)}
                            </span>
                            <h2 className="text-xl font-semibold text-gray-900">{useCase.name}</h2>
                        </div>
                        <p className="text-sm text-gray-600">{useCase.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-6 px-6">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'configuration' && renderConfigurationTab()}
                    {activeTab === 'execution' && renderExecutionTab()}
                    {activeTab === 'metadata' && renderMetadataTab()}
                    {activeTab === 'analytics' && renderAnalyticsTab()}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock size={16} />
                        <span>Last updated: {formatDate(useCase.updated_at)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    console.log('🔧 UseCaseDetailModal: Edit button clicked');
                                    console.log('🔧 Use case to edit:', useCase);
                                    console.log('🔧 onEdit callback:', onEdit);
                                    onEdit(useCase);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Edit size={16} />
                                <span>Edit</span>
                            </button>
                        )}
                        
                        
                        {onApply && (
                            <button
                                onClick={handleApply}
                                disabled={isApplying}
                                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {isApplying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Applying...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} />
                                        <span>Apply Use Case</span>
                                    </>
                                )}
                            </button>
                        )}
                        
                        {onDelete && (
                            <button
                                onClick={() => onDelete(useCase)}
                                className="flex items-center space-x-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={16} />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseCaseDetailModal;