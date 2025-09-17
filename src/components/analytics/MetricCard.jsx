import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue',
    size = 'default' 
}) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        gray: 'bg-gray-50 text-gray-600 border-gray-100'
    };

    const iconColorClasses = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
        orange: 'text-orange-500',
        red: 'text-red-500',
        gray: 'text-gray-500'
    };

    const valueColorClasses = {
        blue: 'text-blue-900',
        green: 'text-green-900',
        purple: 'text-purple-900',
        orange: 'text-orange-900',
        red: 'text-red-900',
        gray: 'text-gray-900'
    };

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
        if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-500';
        if (trend === 'down') return 'text-red-500';
        return 'text-gray-400';
    };

    const sizeClasses = {
        small: 'p-2',
        default: 'p-3',
        large: 'p-4'
    };

    const textSizeClasses = {
        small: {
            title: 'text-xs',
            value: 'text-sm',
            subtitle: 'text-xs'
        },
        default: {
            title: 'text-xs',
            value: 'text-lg',
            subtitle: 'text-xs'
        },
        large: {
            title: 'text-sm',
            value: 'text-xl',
            subtitle: 'text-sm'
        }
    };

    const iconSizeClasses = {
        small: 'w-4 h-4',
        default: 'w-5 h-5',
        large: 'w-6 h-6'
    };

    return (
        <div className={`${colorClasses[color]} border rounded-lg ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm`}>
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className={`${textSizeClasses[size].title} font-medium truncate`}>
                        {title}
                    </p>
                    <p className={`${textSizeClasses[size].value} font-semibold ${valueColorClasses[color]} mt-1`}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className={`${textSizeClasses[size].subtitle} text-gray-500 mt-1 truncate`}>
                            {subtitle}
                        </p>
                    )}
                    {(trend || trendValue) && (
                        <div className={`flex items-center space-x-1 mt-1 ${getTrendColor()}`}>
                            {trend && getTrendIcon()}
                            {trendValue && (
                                <span className={`${textSizeClasses[size].subtitle} font-medium`}>
                                    {trendValue}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {Icon && (
                    <Icon className={`${iconColorClasses[color]} ${iconSizeClasses[size]} flex-shrink-0 ml-2`} />
                )}
            </div>
        </div>
    );
};

export default MetricCard;