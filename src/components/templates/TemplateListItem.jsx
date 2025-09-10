/**
 * Template List Item Component
 * Displays individual template information in list format
 */

import React, { useState } from 'react';
import {
    Star,
    Users,
    Clock,
    Tag,
    CheckCircle,
    MoreVertical,
    Settings,
    Copy,
    Trash2
} from 'lucide-react';
import { templateService } from '../../services/templateService';

const TemplateListItem = ({ 
    template, 
    isSelected = false, 
    onSelect, 
    onRate = null,
    onEdit = null,
    onDelete = null,
    onDuplicate = null,
    showActions = false 
}) => {
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
            console.error('Failed to rate template:', error);
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

    const getTemplateTypeColor = (type) => {
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
        <div className={`group relative bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
            isSelected 
                ? 'border-blue-500 shadow-md ring-2 ring-blue-100' 
                : 'border-gray-200 hover:border-gray-300'
        }`}>
            <div className="flex items-center space-x-4">
                {/* Icon & Basic Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                        {templateService.getTemplateTypeIcon(template.template_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {template.name}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                getTemplateTypeColor(template.template_type)
                            }`}>
                                {templateService.formatTemplateTypeDisplay(template.template_type)}
                            </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                            {template.description}
                        </p>
                        
                        <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {template.category}
                            </span>
                            
                            {/* Tags */}
                            {template.tags && template.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                    <Tag size={10} className="text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                        {template.tags.slice(0, 2).join(', ')}
                                        {template.tags.length > 2 && ` +${template.tags.length - 2}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{template.usage_count || 0}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        {renderStars(template.rating || 0, template.rating_count || 0)}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span className="text-xs">{formatDate(template.updated_at)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    {/* Rating (if allowed) */}
                    {onRate && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {renderStars(rating || template.rating || 0, 0, true)}
                        </div>
                    )}
                    
                    {/* Select Button */}
                    <button
                        onClick={onSelect}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isSelected
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                    >
                        {isSelected ? (
                            <div className="flex items-center space-x-1">
                                <CheckCircle size={12} />
                                <span>Selected</span>
                            </div>
                        ) : (
                            'Select'
                        )}
                    </button>

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
                                                onEdit?.(template);
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
                                                onDuplicate?.(template);
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
                                                onDelete?.(template);
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
            </div>

            {/* Author */}
            <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    {template.created_by ? `Created by ${template.created_by}` : 'Anonymous author'}
                </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                </div>
            )}
        </div>
    );
};

export default TemplateListItem;