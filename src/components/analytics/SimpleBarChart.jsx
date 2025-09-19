import React from 'react';

const SimpleBarChart = ({data, title, height = 120}) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                No data available
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value));

    return (
        <div className="w-full">
            {title && (
                <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
            )}
            <div className="flex items-end justify-between space-x-1" style={{height}}>
                {data.map((item, index) => {
                    const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 20) : 0;

                    return (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div className="flex-1 flex items-end">
                                <div
                                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                                    style={{height: `${barHeight}px`, minHeight: item.value > 0 ? '2px' : '0px'}}
                                    title={`${item.label}: ${item.value}`}
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-1 text-center truncate w-full">
                                {item.label}
                            </div>
                            <div className="text-xs font-medium text-gray-700">
                                {item.value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SimpleBarChart;