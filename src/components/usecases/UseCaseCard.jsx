/**
 * Use Case Card Component
 * Displays individual use case information in card format
 */

import React, { useState } from 'react';
import {
    Star,
    Users,
    Clock,
    Tag,
    Eye,
    Heart,
    CheckCircle,
    ExternalLink,
    MoreVertical,
    Settings,
    Copy,
    Trash2
} from 'lucide-react';
import { useCaseService } from '../../services/useCaseService';

const UseCaseCard = ({ 
    useCase, 
    isSelected = false, 
    onSelect, 
    onRate = null,
    onEdit = null,
    onDelete = null,
    onDuplicate = null,
    onView = null,
    onApply = null,
    showActions = false 
}) => {
    // Defensive check for useCase prop
    if (!useCase) {
        console.warn('UseCaseCard: useCase prop is undefined or null');
        return null;
    }
    
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [rating, setRating] = useState(0);
    const [isRating, setIsRating] = useState(false);

    const handleRatingClick = async (newRating) => {
        if (!onRate) return;
        
        try {
            setIsRating(true);
            await onRate(newRating);
            setRating(newRating);
        } catch (error) {
            console.error('Failed to rate use case:', error);
        } finally {
            setIsRating(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
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

    const renderStars = (rating, ratingCount, interactive = false) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    onClick={interactive ? () => handleRatingClick(i) : undefined}
                    disabled={isRating}
                    className={`${
                        interactive ? 'cursor-pointer hover:text-yellow-500' : 'cursor-default'
                    } ${
                        i <= Math.round(rating) ? 'text-yellow-500' : 'text-gray-300'
                    } ${isRating ? 'opacity-50' : ''}`}
                >
                    <Star size={12} fill="currentColor" />
                </button>
            );
        }
        return (
            <div className="flex items-center space-x-1">
                <div className="flex items-center">
                    {stars}
                </div>
                {ratingCount > 0 && (
                    <span className="text-xs text-gray-500 ml-1">({ratingCount})</span>
                )}
            </div>
        );
    };

    return (
        <div
            className={`relative group bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-hidden ${
                isSelected 
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">
                                {useCaseService.getUseCaseTypeIcon(useCase?.use_case_type || 'data_processing')}
                            </span>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                                {useCase?.name || 'Unnamed Use Case'}
                            </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                getUseCaseTypeColor(useCase?.use_case_type || 'data_processing')
                            }`}>
                                {useCaseService.formatUseCaseTypeDisplay(useCase?.use_case_type)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {useCase?.category}
                            </span>
                        </div>
                    </div>
                    
                    {/* Actions Menu */}
                    {showActions && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg z-20 border">
                                    <div className="py-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit?.(useCase);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        >
                                            <Settings size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDuplicate?.(useCase);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        >
                                            <Copy size={14} />
                                            <span>Duplicate</span>
                                        </button>
                                        <hr className="my-1" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete?.(useCase);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                        >
                                            <Trash2 size={14} />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {useCase?.description}
                </p>

                {/* Tags */}
                {useCase?.tags && useCase?.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {useCase?.tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                            >
                                <Tag size={10} className="mr-1" />
                                {tag}
                            </span>
                        ))}
                        {useCase?.tags.length > 3 && (
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                +{useCase?.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="px-4 pb-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                            <Users size={12} />
                            <span>{useCase?.usage_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            {renderStars(useCase?.rating || 0, useCase?.rating_count || 0)}
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{formatDate(useCase?.updated_at)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {useCase?.created_by ? `by ${useCase?.created_by}` : 'Anonymous'}
                    </div>
                    
                    <div className="flex items-center space-x-1 justify-end flex-wrap relative" style={{ zIndex: 20 }}>
                        {console.log('UseCaseCard render:', { 
                            isSelected, 
                            hasOnApply: !!onApply, 
                            hasOnView: !!onView,
                            useCaseName: useCase?.name 
                        })}
                        
                        {/* Apply Button (when selected) */}
                        {isSelected && onApply && (
                            <button
                                onClick={(e) => {
                                    console.log('UseCaseCard: Apply button clicked');
                                    e.stopPropagation();
                                    onApply(useCase);
                                }}
                                className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 transition-colors"
                                style={{ zIndex: 10 }}
                            >
                                <div className="flex items-center space-x-1">
                                    <ExternalLink size={10} />
                                    <span>Apply</span>
                                </div>
                            </button>
                        )}
                        
                        {/* View Button (when selected) */}
                        {isSelected && onView && (
                            <button
                                onClick={(e) => {
                                    console.log('UseCaseCard: View button clicked');
                                    e.stopPropagation();
                                    onView(useCase);
                                }}
                                className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition-colors"
                                style={{ zIndex: 10 }}
                            >
                                <div className="flex items-center space-x-1">
                                    <Eye size={10} />
                                    <span>View</span>
                                </div>
                            </button>
                        )}
                        
                        {/* Delete Button (when selected) */}
                        {isSelected && onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(useCase);
                                }}
                                className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors"
                            >
                                <div className="flex items-center space-x-1">
                                    <Trash2 size={10} />
                                    <span>Delete</span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Overlay */}
            {isHovered && !isSelected && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-5 pointer-events-none" />
            )}

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                </div>
            )}

            {/* Click overlay for selection - positioned behind buttons */}
            <div 
                className="absolute inset-0 cursor-pointer"
                style={{ zIndex: 1 }}
                onClick={onSelect}
            />
        </div>
    );
};

export default UseCaseCard;