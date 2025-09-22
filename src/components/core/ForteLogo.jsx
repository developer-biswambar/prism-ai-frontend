import React from 'react';

const ForteLogo = ({ size = 40, className = "", animated = true }) => {
    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={animated ? "animate-pulse" : ""}
            >
                {/* Gradient Definitions */}
                <defs>
                    <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                        <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.1" />
                    </radialGradient>
                </defs>

                {/* Main Robot Body - Rounded Rectangle */}
                <rect
                    x="20"
                    y="35"
                    width="60"
                    height="45"
                    rx="8"
                    ry="8"
                    fill="url(#prismGradient)"
                    stroke="#1E40AF"
                    strokeWidth="2"
                />

                {/* Robot Head/Top Section */}
                <rect
                    x="25"
                    y="25"
                    width="50"
                    height="20"
                    rx="10"
                    ry="10"
                    fill="url(#prismGradient)"
                    stroke="#1E40AF"
                    strokeWidth="2"
                />

                {/* Eyes - WALL-E style binocular eyes */}
                <circle
                    cx="35"
                    cy="32"
                    r="6"
                    fill="url(#eyeGradient)"
                    stroke="#1E40AF"
                    strokeWidth="1.5"
                />
                <circle
                    cx="65"
                    cy="32"
                    r="6"
                    fill="url(#eyeGradient)"
                    stroke="#1E40AF"
                    strokeWidth="1.5"
                />

                {/* Eye pupils - animated */}
                <circle
                    cx="35"
                    cy="32"
                    r="3"
                    fill="#1E40AF"
                    className={animated ? "animate-bounce" : ""}
                />
                <circle
                    cx="65"
                    cy="32"
                    r="3"
                    fill="#1E40AF"
                    className={animated ? "animate-bounce" : ""}
                />

                {/* Eye highlights */}
                <circle cx="36" cy="30" r="1.5" fill="#FFFFFF" opacity="0.9" />
                <circle cx="66" cy="30" r="1.5" fill="#FFFFFF" opacity="0.9" />

                {/* Body Details - Data Processing Elements */}
                <rect x="30" y="45" width="40" height="3" rx="1.5" fill="#60A5FA" opacity="0.8" />
                <rect x="30" y="52" width="35" height="2" rx="1" fill="#60A5FA" opacity="0.6" />
                <rect x="30" y="57" width="30" height="2" rx="1" fill="#60A5FA" opacity="0.6" />

                {/* Central Processing Unit - Prism Element */}
                <polygon
                    points="50,62 45,70 55,70"
                    fill="url(#glowGradient)"
                    stroke="#3B82F6"
                    strokeWidth="1"
                />

                {/* Antennae/Sensors */}
                <line x1="30" y1="25" x2="28" y2="18" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
                <line x1="70" y1="25" x2="72" y2="18" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
                <circle cx="28" cy="18" r="2" fill="#EC4899" />
                <circle cx="72" cy="18" r="2" fill="#EC4899" />

                {/* Base/Tracks - WALL-E style */}
                <rect x="15" y="80" width="70" height="8" rx="4" fill="#374151" />
                <rect x="18" y="82" width="8" height="4" rx="2" fill="#6B7280" />
                <rect x="30" y="82" width="8" height="4" rx="2" fill="#6B7280" />
                <rect x="42" y="82" width="8" height="4" rx="2" fill="#6B7280" />
                <rect x="54" y="82" width="8" height="4" rx="2" fill="#6B7280" />
                <rect x="66" y="82" width="8" height="4" rx="2" fill="#6B7280" />
                <rect x="74" y="82" width="8" height="4" rx="2" fill="#6B7280" />

                {/* Glow Effect */}
                {animated && (
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#prismGradient)"
                        strokeWidth="0.5"
                        opacity="0.3"
                        className="animate-ping"
                    />
                )}
            </svg>

            {/* Optional Text Label */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 whitespace-nowrap">
                FORTE AI
            </div>
        </div>
    );
};

export default ForteLogo;