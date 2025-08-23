// src/components/rules/UnifiedRulesManager.jsx - Unified Rules Management Component
import React, { useEffect, useState, useMemo } from 'react';
import {
    AlertCircle,
    Download,
    Grid,
    List,
    Loader,
    RefreshCw,
    Search,
    Settings2,
    SortAsc,
    SortDesc,
    Plus,
    Filter,
    BookOpen,
    Save,
    Trash2,
    Edit,
    Eye,
    GitCompare,
    Shuffle,
    Zap,
    X,
    ChevronDown,
    ChevronRight,
    Calendar,
    Tag,
    TrendingUp
} from 'lucide-react';
import { unifiedRulesApiService } from '../../services/unifiedRulesApiService.js';

const UnifiedRulesManager = ({ isOpen, onClose, initialRuleType = null }) => {
    // State management
    const [rulesData, setRulesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRuleType, setSelectedRuleType] = useState(initialRuleType || 'all');
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('cards');
    
    // Modal states
    const [showFilters, setShowFilters] = useState(false);
    const [showRuleDetails, setShowRuleDetails] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState(null);
    
    // Statistics
    const [statistics, setStatistics] = useState(null);

    // Load rules data
    const loadRulesData = async (forceRefresh = false) => {
        if (loading && !forceRefresh) return;
        
        setLoading(true);
        setError(null);
        
        try {
            let allRules = [];
            
            if (selectedRuleType === 'all') {
                const result = await unifiedRulesApiService.getAllRules({
                    limit: 100
                });
                
                if (result.success) {
                    allRules = result.rules || [];
                } else {
                    throw new Error(result.error || 'Failed to load rules');
                }
            } else {
                const result = await unifiedRulesApiService.getRules(selectedRuleType, {
                    limit: 100
                });
                
                if (result.success) {
                    allRules = result.rules.map(rule => ({ ...rule, rule_type: selectedRuleType })) || [];
                } else {
                    throw new Error(result.error || 'Failed to load rules');
                }
            }
            
            setRulesData(allRules);
            
            // Calculate statistics
            const stats = unifiedRulesApiService.getRuleStatistics(allRules);
            setStatistics(stats);
            
        } catch (err) {
            console.error('Error loading rules:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load rules on mount and when rule type changes
    useEffect(() => {
        if (isOpen) {
            loadRulesData();
        }
    }, [isOpen, selectedRuleType]);

    // Handle rule deletion
    const handleDeleteRule = async () => {
        if (!ruleToDelete) return;
        
        try {
            const result = await unifiedRulesApiService.deleteRule(
                ruleToDelete.rule_type,
                ruleToDelete.id
            );
            
            if (result.success) {
                setRulesData(prevRules => 
                    prevRules.filter(rule => rule.id !== ruleToDelete.id)
                );
                setShowDeleteConfirm(false);
                setRuleToDelete(null);
            } else {
                throw new Error(result.error || 'Failed to delete rule');
            }
        } catch (err) {
            console.error('Error deleting rule:', err);
            alert(`Failed to delete rule: ${err.message}`);
        }
    };

    // Handle rule usage tracking
    const handleMarkAsUsed = async (rule) => {
        try {
            await unifiedRulesApiService.markRuleAsUsed(rule.rule_type, rule.id);
            
            // Update local state
            setRulesData(prevRules => 
                prevRules.map(r => 
                    r.id === rule.id 
                        ? { ...r, usage_count: (r.usage_count || 0) + 1, last_used_at: new Date().toISOString() }
                        : r
                )
            );
        } catch (err) {
            console.error('Error marking rule as used:', err);
        }
    };

    // Export rules
    const handleExportRules = () => {
        if (!rulesData || rulesData.length === 0) return;
        
        const exportData = filteredAndSortedRules;
        const filename = selectedRuleType === 'all' 
            ? 'all_rules_export'
            : `${selectedRuleType}_rules_export`;
            
        unifiedRulesApiService.exportRules(exportData, filename);
    };

    // Filtered and sorted rules
    const filteredAndSortedRules = useMemo(() => {
        let filtered = rulesData.filter(rule => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = (
                    rule.name?.toLowerCase().includes(searchLower) ||
                    rule.description?.toLowerCase().includes(searchLower) ||
                    rule.category?.toLowerCase().includes(searchLower) ||
                    rule.rule_type?.toLowerCase().includes(searchLower) ||
                    (rule.tags && rule.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                );
                
                if (!matchesSearch) return false;
            }
            
            // Category filter
            if (filterBy !== 'all') {
                if (filterBy.startsWith('type:')) {
                    const ruleType = filterBy.replace('type:', '');
                    if (rule.rule_type !== ruleType) return false;
                } else if (filterBy.startsWith('category:')) {
                    const category = filterBy.replace('category:', '');
                    if (rule.category !== category) return false;
                } else if (filterBy === 'recent') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const createdDate = new Date(rule.created_at);
                    if (createdDate <= weekAgo) return false;
                } else if (filterBy === 'frequently_used') {
                    if ((rule.usage_count || 0) < 3) return false;
                }
            }
            
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at || 0);
                    bValue = new Date(b.created_at || 0);
                    break;
                case 'updated_at':
                    aValue = new Date(a.updated_at || 0);
                    bValue = new Date(b.updated_at || 0);
                    break;
                case 'usage_count':
                    aValue = a.usage_count || 0;
                    bValue = b.usage_count || 0;
                    break;
                case 'category':
                    aValue = (a.category || '').toLowerCase();
                    bValue = (b.category || '').toLowerCase();
                    break;
                default:
                    aValue = new Date(a.updated_at || 0);
                    bValue = new Date(b.updated_at || 0);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [rulesData, searchTerm, filterBy, sortBy, sortOrder]);

    // Get unique categories and types for filters
    const filterOptions = useMemo(() => {
        const categories = [...new Set(rulesData.map(rule => rule.category).filter(Boolean))];
        const types = [...new Set(rulesData.map(rule => rule.rule_type).filter(Boolean))];
        
        return [
            { value: 'all', label: 'All Rules' },
            { value: 'recent', label: 'Recent (7 days)' },
            { value: 'frequently_used', label: 'Frequently Used (3+)' },
            ...categories.map(cat => ({ value: `category:${cat}`, label: `Category: ${cat}` })),
            ...types.map(type => ({ value: `type:${type}`, label: `Type: ${type}` }))
        ];
    }, [rulesData]);

    // Get rule type icon and color
    const getRuleTypeInfo = (ruleType) => {
        const typeMap = {
            'delta': { icon: GitCompare, color: 'purple', label: 'Delta Rules' },
            'delta_generation': { icon: GitCompare, color: 'purple', label: 'Delta Rules' },
            'reconciliation': { icon: Shuffle, color: 'blue', label: 'Reconciliation Rules' },
            'transformation': { icon: Zap, color: 'green', label: 'Transformation Rules' }
        };
        
        return typeMap[ruleType] || { icon: Settings2, color: 'gray', label: 'Other Rules' };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-screen flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Rules Management</h2>
                            <p className="text-sm text-gray-500">
                                Manage your Delta, Reconciliation, and Transformation rules
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Statistics Bar */}
                {statistics && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm">
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-medium text-gray-900">{statistics.total}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-600">Total Usage:</span>
                                    <span className="font-medium text-gray-900">{statistics.total_usage}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span className="text-gray-600">Recent:</span>
                                    <span className="font-medium text-gray-900">{statistics.recently_created}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {Object.entries(statistics.by_type).map(([type, count]) => {
                                    const typeInfo = getRuleTypeInfo(type);
                                    const TypeIcon = typeInfo.icon;
                                    return (
                                        <div key={type} className="flex items-center space-x-1 px-2 py-1 bg-white rounded text-xs">
                                            <TypeIcon className={`w-3 h-3 text-${typeInfo.color}-500`} />
                                            <span className="text-gray-600">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="px-6 py-4 border-b border-gray-200 space-y-4">
                    {/* Rule Type Selection */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Rule Type:</span>
                        <div className="flex items-center space-x-2">
                            {[
                                { value: 'all', label: 'All Rules', icon: BookOpen, color: 'gray' },
                                { value: 'delta', label: 'Delta', icon: GitCompare, color: 'purple' },
                                { value: 'reconciliation', label: 'Reconciliation', icon: Shuffle, color: 'blue' },
                                { value: 'transformation', label: 'Transformation', icon: Zap, color: 'green' }
                            ].map(type => {
                                const TypeIcon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => setSelectedRuleType(type.value)}
                                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedRuleType === type.value
                                                ? `bg-${type.color}-100 text-${type.color}-800 border border-${type.color}-200`
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <TypeIcon className="w-4 h-4 mr-2" />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search rules..."
                            />
                        </div>

                        {/* Filter */}
                        <div>
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                            >
                                {filterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                            >
                                <option value="updated_at">Sort by Updated</option>
                                <option value="created_at">Sort by Created</option>
                                <option value="name">Sort by Name</option>
                                <option value="usage_count">Sort by Usage</option>
                                <option value="category">Sort by Category</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="flex items-center justify-center w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className="w-4 h-4 mr-2" />
                                ) : (
                                    <SortDesc className="w-4 h-4 mr-2" />
                                )}
                                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            </button>
                        </div>

                        {/* View Mode */}
                        <div className="flex border border-gray-300 rounded-md">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-l-md ${
                                    viewMode === 'cards'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Grid className="w-4 h-4 mr-2" />
                                Cards
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <List className="w-4 h-4 mr-2" />
                                List
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => loadRulesData(true)}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={handleExportRules}
                                disabled={filteredAndSortedRules.length === 0}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                                <p className="mt-2 text-sm text-gray-500">Loading rules...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Rules</h3>
                                <p className="mt-1 text-sm text-gray-500">{error}</p>
                                <button
                                    onClick={() => loadRulesData(true)}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : filteredAndSortedRules.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Settings2 className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {rulesData.length === 0 ? 'No rules found' : 'No matching rules'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {rulesData.length === 0
                                        ? 'No rules have been created yet.'
                                        : 'Try adjusting your search or filter criteria.'
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">
                                    Showing {filteredAndSortedRules.length} of {rulesData.length} rules
                                </p>
                            </div>

                            {/* Rules Display */}
                            {viewMode === 'cards' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAndSortedRules.map((rule) => (
                                        <RuleCard
                                            key={rule.id}
                                            rule={rule}
                                            onView={() => {
                                                setSelectedRule(rule);
                                                setShowRuleDetails(true);
                                            }}
                                            onEdit={() => console.log('Edit rule:', rule.id)}
                                            onDelete={() => {
                                                setRuleToDelete(rule);
                                                setShowDeleteConfirm(true);
                                            }}
                                            onMarkAsUsed={() => handleMarkAsUsed(rule)}
                                            getRuleTypeInfo={getRuleTypeInfo}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {filteredAndSortedRules.map((rule) => (
                                            <RuleListItem
                                                key={rule.id}
                                                rule={rule}
                                                onView={() => {
                                                    setSelectedRule(rule);
                                                    setShowRuleDetails(true);
                                                }}
                                                onEdit={() => console.log('Edit rule:', rule.id)}
                                                onDelete={() => {
                                                    setRuleToDelete(rule);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                onMarkAsUsed={() => handleMarkAsUsed(rule)}
                                                getRuleTypeInfo={getRuleTypeInfo}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Rule Details Modal */}
                {showRuleDetails && selectedRule && (
                    <RuleDetailsModal
                        rule={selectedRule}
                        onClose={() => {
                            setShowRuleDetails(false);
                            setSelectedRule(null);
                        }}
                        getRuleTypeInfo={getRuleTypeInfo}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && ruleToDelete && (
                    <DeleteConfirmModal
                        rule={ruleToDelete}
                        onConfirm={handleDeleteRule}
                        onCancel={() => {
                            setShowDeleteConfirm(false);
                            setRuleToDelete(null);
                        }}
                        getRuleTypeInfo={getRuleTypeInfo}
                    />
                )}
            </div>
        </div>
    );
};

// Rule Card Component
const RuleCard = ({ rule, onView, onEdit, onDelete, onMarkAsUsed, getRuleTypeInfo }) => {
    const typeInfo = getRuleTypeInfo(rule.rule_type);
    const TypeIcon = typeInfo.icon;

    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-500`} />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                            {typeInfo.label}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">
                        {rule.usage_count || 0} uses
                    </span>
                </div>

                {/* Title and Description */}
                <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-1 truncate" title={rule.name}>
                        {rule.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {rule.description || 'No description provided'}
                    </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className={`px-2 py-1 rounded bg-gray-100 text-gray-600`}>
                        {rule.category}
                    </span>
                    <span>
                        {new Date(rule.updated_at || rule.created_at).toLocaleDateString()}
                    </span>
                </div>

                {/* Tags */}
                {rule.tags && rule.tags.length > 0 && (
                    <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                            {rule.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </span>
                            ))}
                            {rule.tags.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                    +{rule.tags.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onView}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                    </button>
                    <button
                        onClick={onMarkAsUsed}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                        title="Mark as used"
                    >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Use
                    </button>
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center justify-center p-2 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                        title="Delete rule"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Rule List Item Component
const RuleListItem = ({ rule, onView, onEdit, onDelete, onMarkAsUsed, getRuleTypeInfo }) => {
    const typeInfo = getRuleTypeInfo(rule.rule_type);
    const TypeIcon = typeInfo.icon;

    return (
        <li className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-500 flex-shrink-0`} />
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{rule.name}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                                {typeInfo.label}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                {rule.category}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">{rule.description || 'No description provided'}</p>
                        
                        <div className="mt-2 flex items-center text-xs text-gray-400 space-x-4">
                            <span>Usage: {rule.usage_count || 0}</span>
                            <span>Updated: {new Date(rule.updated_at || rule.created_at).toLocaleDateString()}</span>
                            {rule.last_used_at && (
                                <span>Last used: {new Date(rule.last_used_at).toLocaleDateString()}</span>
                            )}
                        </div>
                        
                        {rule.tags && rule.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {rule.tags.slice(0, 5).map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                        {tag}
                                    </span>
                                ))}
                                {rule.tags.length > 5 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                        +{rule.tags.length - 5} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                    <button
                        onClick={onView}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                    </button>
                    <button
                        onClick={onEdit}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </button>
                    <button
                        onClick={onMarkAsUsed}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                        title="Mark as used"
                    >
                        <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                        title="Delete rule"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </li>
    );
};

// Rule Details Modal Component  
const RuleDetailsModal = ({ rule, onClose, getRuleTypeInfo }) => {
    const typeInfo = getRuleTypeInfo(rule.rule_type);
    const TypeIcon = typeInfo.icon;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-screen flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <TypeIcon className={`w-6 h-6 text-${typeInfo.color}-500`} />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                            <p className="text-sm text-gray-500">{typeInfo.label}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-gray-500">Name</dt>
                                    <dd className="mt-1 text-gray-900">{rule.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Category</dt>
                                    <dd className="mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {rule.category}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Description</dt>
                                    <dd className="mt-1 text-gray-900">{rule.description || 'No description provided'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Rule Type</dt>
                                    <dd className="mt-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                                            <TypeIcon className="w-3 h-3 mr-1" />
                                            {typeInfo.label}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Usage Statistics */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Statistics</h4>
                            <dl className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <dt className="text-gray-500">Usage Count</dt>
                                    <dd className="mt-1 text-gray-900 font-medium">{rule.usage_count || 0}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Created</dt>
                                    <dd className="mt-1 text-gray-900">{new Date(rule.created_at).toLocaleString()}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-gray-900">{new Date(rule.updated_at || rule.created_at).toLocaleString()}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Tags */}
                        {rule.tags && rule.tags.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {rule.tags.map((tag, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-sm bg-gray-100 text-gray-700">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rule Configuration */}
                        {rule.rule_config && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Rule Configuration</h4>
                                <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                        {JSON.stringify(rule.rule_config, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ rule, onConfirm, onCancel, getRuleTypeInfo }) => {
    const typeInfo = getRuleTypeInfo(rule.rule_type);
    const TypeIcon = typeInfo.icon;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Rule</h3>
                            <p className="text-sm text-gray-500">This action cannot be undone</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-md p-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-500`} />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                                <p className="text-xs text-gray-500">{typeInfo.label} • {rule.category}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete this rule? This will permanently remove the rule 
                        and cannot be undone.
                    </p>

                    <div className="flex space-x-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                            Delete Rule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedRulesManager;