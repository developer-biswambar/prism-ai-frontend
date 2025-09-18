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
    Trash2,
    Play,
    Loader,
    FileText
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
    showActions = false,
    isLoading = false,
    loadingMessage = "Applying use case..."
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
            className={`relative group bg-white rounded-lg border transition-all duration-200 overflow-hidden h-[280px] flex flex-col ${
                isSelected 
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        {/* Icon and Title in same row */}
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm">
                                    {useCaseService.getUseCaseTypeIcon(useCase?.use_case_type || 'data_processing')}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 flex-1">
                                {useCase?.name || 'Unnamed Use Case'}
                            </h3>
                        </div>
                        
                        {/* Type badges and File Requirements */}
                        <div className="flex items-center space-x-1 mb-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                getUseCaseTypeColor(useCase?.use_case_type || 'data_processing')
                            }`}>
                                {useCaseService.formatUseCaseTypeDisplay(useCase?.use_case_type)}
                            </span>
                            
                            {/* File Requirements Badge */}
                            {useCase?.use_case_metadata?.file_requirements?.required_file_count > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border-amber-200">
                                    <FileText size={10} className="mr-1" />
                                    {useCase.use_case_metadata.file_requirements.required_file_count} file{useCase.use_case_metadata.file_requirements.required_file_count > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* File Roles Display */}
                        {useCase?.use_case_metadata?.file_requirements?.file_roles && (
                            <div className="mb-2">
                                <div className="text-xs text-gray-500 mb-1">Required Files:</div>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(useCase.use_case_metadata.file_requirements.file_roles).map(([role, label]) => (
                                        <span 
                                            key={role}
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                            {label || role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
                    
                {/* Actions Menu */}
                    {(showActions || isSelected) && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className={`p-1 text-gray-400 hover:text-gray-600 transition-opacity ${
                                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
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
                
                {/* Description */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-2 flex-1">
                    {useCase?.description || 'No description available'}
                </p>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <Users size={10} />
                            <span>{useCase?.usage_count || 0}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{formatDate(useCase?.updated_at)}</span>
                    </div>
                </div>
                    
                    {/* Action Buttons (when selected) */}
                    {isSelected && (
                        <div className="flex items-center space-x-2 mt-2 relative px-3" style={{ zIndex: 30 }}>
                            {onView && (
                                <button
                                    onClick={(e) => {
                                        console.log('UseCaseCard: View button clicked');
                                        e.stopPropagation();
                                        onView(useCase);
                                    }}
                                    className="flex-1 py-1.5 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition-colors relative"
                                    style={{ zIndex: 40 }}
                                >
                                    <div className="flex items-center justify-center space-x-1">
                                        <Eye size={10} />
                                        <span>View</span>
                                    </div>
                                </button>
                            )}
                            
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(useCase);
                                    }}
                                    className="flex-1 py-1.5 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors relative"
                                    style={{ zIndex: 40 }}
                                >
                                    <div className="flex items-center justify-center space-x-1">
                                        <Trash2 size={10} />
                                        <span>Delete</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                
                {/* Apply Button - Always at bottom */}
                {onApply && (
                    <div className="p-3 mt-auto" style={{ zIndex: 20 }}>
                        <button
                            onClick={(e) => {
                                console.log('UseCaseCard: Apply button clicked');
                                e.stopPropagation();
                                if (!isLoading) {
                                    onApply(useCase);
                                }
                            }}
                            disabled={isLoading}
                            className={`w-full py-3 rounded-md text-sm font-medium transition-colors shadow-sm ${
                                isLoading 
                                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-1.5">
                                {isLoading ? (
                                    <>
                                        <Loader size={12} className="animate-spin" />
                                        <span>{loadingMessage}</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={12} />
                                        <span>Apply Use Case</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                )}

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

            {/* Click overlay for selection - positioned behind buttons, exclude Apply button area */}
            <div 
                className={`absolute cursor-pointer ${
                    isSelected && (onView || onDelete) 
                        ? (onApply ? 'inset-0 bottom-16 right-0' : 'inset-0 bottom-12') 
                        : (onApply ? 'inset-0 bottom-16' : 'inset-0')
                }`}
                style={{ zIndex: 1 }}
                onClick={onSelect}
            />
        </div>
    );
};

export default UseCaseCard;