import React from 'react';
import {
    Brain,
    ChevronLeft,
    FolderOpen,
    X
} from 'lucide-react';

const AppHeader = ({
    title = "Miscellaneous Data Processing",
    subtitle = null,
    showBackButton = false,
    onBackClick = null,
    showCloseButton = false,
    onCloseClick = null,
    showFileLibrary = true,
    onFileLibraryClick = null,
    className = ""
}) => {
    const handleFileLibraryClick = () => {
        if (onFileLibraryClick) {
            onFileLibraryClick();
        } else {
            // Default behavior - open in new window
            window.open('/file-library', '_blank');
        }
    };

    return (
        <div className={`bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {/* Back Button */}
                    {showBackButton && onBackClick && (
                        <button
                            onClick={onBackClick}
                            className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 flex items-center space-x-1 transition-colors duration-200"
                            title="Back to Use Case Gallery"
                        >
                            <ChevronLeft size={18} />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    )}
                    
                    {/* App Icon */}
                    <Brain className="text-white" size={24} />
                    
                    {/* Title and Subtitle */}
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-blue-100 opacity-90">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Right Side Actions */}
                <div className="flex items-center space-x-2">
                    {/* File Library Button */}
                    {showFileLibrary && (
                        <button
                            onClick={handleFileLibraryClick}
                            className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 flex items-center space-x-1 transition-colors duration-200"
                            title="Open File Library"
                        >
                            <FolderOpen size={18} />
                            <span className="text-sm font-medium">File Library</span>
                        </button>
                    )}
                    
                    {/* Close Button */}
                    {showCloseButton && onCloseClick && (
                        <button
                            onClick={onCloseClick}
                            className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppHeader;