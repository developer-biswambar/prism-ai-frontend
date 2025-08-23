// src/components/pages/RulesManagementPage.jsx - Full-page Rules Management Interface
import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Settings,
    ArrowLeft,
    Plus,
    Upload,
    Download,
    HelpCircle,
    BarChart3,
    Layers,
    Clock,
    Star
} from 'lucide-react';
import UnifiedRulesManager from '../rules/UnifiedRulesManager.jsx';
import { unifiedRulesApiService } from '../../services/unifiedRulesApiService.js';

const RulesManagementPage = ({ onBack }) => {
    const [activeView, setActiveView] = useState('overview'); // overview, rules, statistics, help
    const [showRulesManager, setShowRulesManager] = useState(false);
    const [selectedRuleType, setSelectedRuleType] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [recentRules, setRecentRules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load overview data
    useEffect(() => {
        loadOverviewData();
    }, []);

    const loadOverviewData = async () => {
        setLoading(true);
        try {
            // Load all rules for statistics
            const result = await unifiedRulesApiService.getAllRules({ limit: 1000 });
            
            if (result.success) {
                const allRules = result.rules || [];
                
                // Calculate statistics
                const stats = unifiedRulesApiService.getRuleStatistics(allRules);
                setStatistics(stats);
                
                // Get recent rules (last 10)
                const recent = allRules
                    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                    .slice(0, 10);
                setRecentRules(recent);
            }
        } catch (error) {
            console.error('Error loading overview data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRulesManager = (ruleType = null) => {
        setSelectedRuleType(ruleType);
        setShowRulesManager(true);
    };

    const getRuleTypeInfo = (ruleType) => {
        const typeMap = {
            'delta': { color: 'purple', label: 'Delta Rules', description: 'Compare files and identify differences' },
            'delta_generation': { color: 'purple', label: 'Delta Rules', description: 'Compare files and identify differences' },
            'reconciliation': { color: 'blue', label: 'Reconciliation Rules', description: 'Match and reconcile data across sources' },
            'transformation': { color: 'green', label: 'Transformation Rules', description: 'Transform and generate new data structures' }
        };
        
        return typeMap[ruleType] || { color: 'gray', label: 'Other Rules', description: 'Other rule types' };
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                            
                            <div className="flex items-center space-x-3">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Rules Management</h1>
                                    <p className="text-sm text-gray-500">Manage your processing rules and configurations</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => handleOpenRulesManager()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Manage Rules
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'rules', label: 'Rules Library', icon: Layers },
                            { id: 'statistics', label: 'Statistics', icon: BarChart3 },
                            { id: 'help', label: 'Help', icon: HelpCircle }
                        ].map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeView === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <TabIcon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeView === 'overview' && (
                    <OverviewTab
                        statistics={statistics}
                        recentRules={recentRules}
                        loading={loading}
                        onOpenRulesManager={handleOpenRulesManager}
                        getRuleTypeInfo={getRuleTypeInfo}
                    />
                )}

                {activeView === 'rules' && (
                    <RulesLibraryTab
                        onOpenRulesManager={handleOpenRulesManager}
                        getRuleTypeInfo={getRuleTypeInfo}
                    />
                )}

                {activeView === 'statistics' && (
                    <StatisticsTab
                        statistics={statistics}
                        loading={loading}
                        getRuleTypeInfo={getRuleTypeInfo}
                    />
                )}

                {activeView === 'help' && <HelpTab />}
            </div>

            {/* Rules Manager Modal */}
            {showRulesManager && (
                <UnifiedRulesManager
                    isOpen={showRulesManager}
                    onClose={() => setShowRulesManager(false)}
                    initialRuleType={selectedRuleType}
                />
            )}
        </div>
    );
};

// Overview Tab Component
const OverviewTab = ({ statistics, recentRules, loading, onOpenRulesManager, getRuleTypeInfo }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Quick Stats */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BookOpen className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Rules</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BarChart3 className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.total_usage}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Recent (7 days)</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.recently_created}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Star className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Most Used</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {statistics.most_used?.name || 'None'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {statistics.most_used?.usage_count || 0} uses
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rule Types Overview */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Rule Types</h3>
                    <p className="text-sm text-gray-500">Manage different types of processing rules</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { type: 'delta', count: statistics?.by_type?.delta || statistics?.by_type?.delta_generation || 0 },
                            { type: 'reconciliation', count: statistics?.by_type?.reconciliation || 0 },
                            { type: 'transformation', count: statistics?.by_type?.transformation || 0 }
                        ].map(({ type, count }) => {
                            const typeInfo = getRuleTypeInfo(type);
                            return (
                                <div
                                    key={type}
                                    className={`p-6 border-2 border-dashed border-${typeInfo.color}-200 rounded-lg hover:border-${typeInfo.color}-300 transition-colors cursor-pointer`}
                                    onClick={() => onOpenRulesManager(type)}
                                >
                                    <div className="text-center">
                                        <div className={`inline-flex items-center justify-center w-12 h-12 bg-${typeInfo.color}-100 rounded-lg mb-4`}>
                                            <Settings className={`w-6 h-6 text-${typeInfo.color}-600`} />
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">{typeInfo.label}</h4>
                                        <p className="text-sm text-gray-500 mb-4">{typeInfo.description}</p>
                                        <div className="flex items-center justify-center space-x-4 text-sm">
                                            <span className={`px-3 py-1 bg-${typeInfo.color}-100 text-${typeInfo.color}-800 rounded-full font-medium`}>
                                                {count} rules
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Rules */}
            {recentRules.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Recent Rules</h3>
                                <p className="text-sm text-gray-500">Recently created or updated rules</p>
                            </div>
                            <button
                                onClick={() => onOpenRulesManager()}
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                View all
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentRules.slice(0, 5).map(rule => {
                                const typeInfo = getRuleTypeInfo(rule.rule_type);
                                return (
                                    <div key={rule.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div className={`flex-shrink-0 w-8 h-8 bg-${typeInfo.color}-100 rounded-lg flex items-center justify-center`}>
                                            <Settings className={`w-4 h-4 text-${typeInfo.color}-600`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{rule.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {typeInfo.label} • {rule.category} • {rule.usage_count || 0} uses
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-xs text-gray-400">
                                            {new Date(rule.updated_at || rule.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Rules Library Tab Component
const RulesLibraryTab = ({ onOpenRulesManager, getRuleTypeInfo }) => {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Access Rules Library</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Browse, search, and manage all your processing rules in one place.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => onOpenRulesManager()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Open Rules Library
                    </button>
                </div>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { type: 'delta', title: 'Delta Rules', description: 'Manage delta generation rules' },
                    { type: 'reconciliation', title: 'Reconciliation Rules', description: 'Manage reconciliation rules' },
                    { type: 'transformation', title: 'Transformation Rules', description: 'Manage transformation rules' }
                ].map(item => {
                    const typeInfo = getRuleTypeInfo(item.type);
                    return (
                        <div
                            key={item.type}
                            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => onOpenRulesManager(item.type)}
                        >
                            <div className={`inline-flex items-center justify-center w-10 h-10 bg-${typeInfo.color}-100 rounded-lg mb-4`}>
                                <Settings className={`w-5 h-5 text-${typeInfo.color}-600`} />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Statistics Tab Component
const StatisticsTab = ({ statistics, loading, getRuleTypeInfo }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading statistics...</p>
                </div>
            </div>
        );
    }

    if (!statistics) {
        return (
            <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
                <p className="mt-1 text-sm text-gray-500">Create some rules to see statistics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Rules</p>
                            <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Usage</p>
                            <p className="text-2xl font-semibold text-gray-900">{statistics.total_usage}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Clock className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Recent (7 days)</p>
                            <p className="text-2xl font-semibold text-gray-900">{statistics.recently_created}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Layers className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Categories</p>
                            <p className="text-2xl font-semibold text-gray-900">{Object.keys(statistics.by_category).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* By Rule Type */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Rules by Type</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {Object.entries(statistics.by_type).map(([type, count]) => {
                                const typeInfo = getRuleTypeInfo(type);
                                const percentage = ((count / statistics.total) * 100).toFixed(1);
                                return (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 bg-${typeInfo.color}-500 rounded-full`}></div>
                                            <span className="text-sm font-medium text-gray-900">{typeInfo.label}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-gray-500">{percentage}%</span>
                                            <span className="text-sm font-medium text-gray-900">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* By Category */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Rules by Category</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {Object.entries(statistics.by_category).map(([category, count]) => {
                                const percentage = ((count / statistics.total) * 100).toFixed(1);
                                return (
                                    <div key={category} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900 capitalize">{category}</span>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-gray-500">{percentage}%</span>
                                            <span className="text-sm font-medium text-gray-900">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Most Used Rule */}
            {statistics.most_used && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Most Used Rule</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <Star className="h-8 w-8 text-yellow-500" />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-gray-900">{statistics.most_used.name}</h4>
                                <p className="text-sm text-gray-500">
                                    {statistics.most_used.usage_count} uses • {statistics.most_used.category} • 
                                    {' '}{getRuleTypeInfo(statistics.most_used.rule_type).label}
                                </p>
                                {statistics.most_used.description && (
                                    <p className="text-sm text-gray-600 mt-1">{statistics.most_used.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Help Tab Component
const HelpTab = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-blue-600" />
                <h3 className="mt-2 text-2xl font-bold text-gray-900">Rules Management Help</h3>
                <p className="mt-1 text-lg text-gray-500">
                    Learn how to effectively manage your processing rules
                </p>
            </div>

            {/* Help Sections */}
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">Getting Started</h4>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                            <p>
                                Rules management allows you to save, organize, and reuse processing configurations across different data operations. 
                                You can create rules for delta generation, reconciliation, and transformation processes.
                            </p>
                            <ul>
                                <li><strong>Delta Rules:</strong> Compare two versions of data and identify changes</li>
                                <li><strong>Reconciliation Rules:</strong> Match and reconcile data from multiple sources</li>
                                <li><strong>Transformation Rules:</strong> Transform data structures and generate new datasets</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">Managing Rules</h4>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                            <h5>Creating Rules</h5>
                            <p>
                                Rules are automatically created when you save configurations from processing workflows. 
                                You can also import rules from JSON files or duplicate existing rules.
                            </p>
                            
                            <h5>Organizing Rules</h5>
                            <p>
                                Use categories and tags to organize your rules. You can filter and search rules by:
                            </p>
                            <ul>
                                <li>Rule type (Delta, Reconciliation, Transformation)</li>
                                <li>Category (Financial, Trading, General, etc.)</li>
                                <li>Tags for custom organization</li>
                                <li>Usage frequency and creation date</li>
                            </ul>

                            <h5>Using Rules</h5>
                            <p>
                                Load saved rules in processing workflows to quickly apply previously configured settings. 
                                Rules track usage statistics to help identify the most valuable configurations.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">Best Practices</h4>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                            <ul>
                                <li><strong>Use descriptive names:</strong> Choose clear, descriptive names for your rules that indicate their purpose</li>
                                <li><strong>Add descriptions:</strong> Include detailed descriptions explaining what the rule does and when to use it</li>
                                <li><strong>Organize with categories:</strong> Use consistent categories to group related rules</li>
                                <li><strong>Tag effectively:</strong> Apply relevant tags to make rules easier to find</li>
                                <li><strong>Review regularly:</strong> Periodically review and clean up unused or outdated rules</li>
                                <li><strong>Export backups:</strong> Export important rules as JSON files for backup and sharing</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">Troubleshooting</h4>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                            <h5>Common Issues</h5>
                            <ul>
                                <li><strong>Rule not loading:</strong> Check that the rule configuration is compatible with your current data structure</li>
                                <li><strong>Missing columns:</strong> Rules may reference columns that don't exist in your current dataset</li>
                                <li><strong>Sync issues:</strong> If rules don't appear, check your network connection and try refreshing</li>
                            </ul>
                            
                            <h5>Data Storage</h5>
                            <p>
                                Rules are stored in DynamoDB for persistence and synchronization across sessions. 
                                Local storage is used as a fallback when the backend is unavailable.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RulesManagementPage;