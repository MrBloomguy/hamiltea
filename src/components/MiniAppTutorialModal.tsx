"use client";

import { Modal } from "./Modal";
import { useState } from "react";

interface MiniAppTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

// Compact YouBuidl coin launch animation
function LaunchCoinAnimation() {
  return (
    <div className="flex flex-col items-center py-1">
      <svg width="90" height="60" viewBox="0 0 120 80" className="overflow-visible">
        <style>{`
          @keyframes coinSpinSmall {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
          }
          @keyframes launchRise {
            0% { transform: translateY(20px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-40px); opacity: 0; }
          }
          .coin-small { 
            animation: coinSpinSmall 2s infinite ease-in-out;
            transform-style: preserve-3d;
          }
          .launch-particle {
            animation: launchRise 1.5s infinite ease-out;
          }
        `}</style>
        
        {/* Coin */}
        <circle cx="60" cy="40" r="16" fill="url(#goldGrad)" className="coin-small" stroke="#d97706" strokeWidth="1" />
        <circle cx="60" cy="40" r="14" fill="none" stroke="#f59e0b" strokeWidth="0.5" opacity="0.5" className="coin-small" />
        
        {/* Launching particles */}
        <circle cx="50" cy="40" r="2" fill="#fbbf24" className="launch-particle" style={{ animationDelay: "0s" }} />
        <circle cx="70" cy="40" r="2" fill="#fbbf24" className="launch-particle" style={{ animationDelay: "0.3s" }} />
        <circle cx="60" cy="50" r="2" fill="#60a5fa" className="launch-particle" style={{ animationDelay: "0.15s" }} />
        
        {/* Base */}
        <rect x="30" y="65" width="60" height="3" fill="#10b981" rx="1.5" opacity="0.6" />
        
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-[9px] font-semibold text-primary mt-0.5">YouBuidl Launch</span>
    </div>
  );
}

// Compact streaming flow animation
function StreamFlowAnimation() {
  return (
    <div className="flex justify-center py-1">
      <svg width="90" height="60" viewBox="0 0 120 80" className="overflow-visible scale-90">
        <style>{`
          @keyframes flowDown {
            0% { offset-distance: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0; }
          }
          @keyframes pulseGlow {
            0%, 100% { r: 2; opacity: 0.6; }
            50% { r: 3; opacity: 1; }
          }
          .flow-line { stroke-dasharray: 2, 4; animation: none; }
          .flow-particle {
            animation: flowDown 2s linear infinite;
          }
          .center-glow {
            animation: pulseGlow 1.5s ease-in-out infinite;
          }
        `}</style>
        
        {/* Source icon */}
        <circle cx="30" cy="20" r="8" fill="#3b82f6" opacity="0.8" stroke="#1e40af" strokeWidth="1" />
        <text x="30" y="24" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">👤</text>
        
        {/* Flowing lines */}
        <path d="M 38 22 Q 50 30 62 22" stroke="#60a5fa" strokeWidth="1.5" fill="none" opacity="0.4" className="flow-line" />
        <path d="M 38 28 Q 50 36 62 28" stroke="#60a5fa" strokeWidth="1.5" fill="none" opacity="0.4" className="flow-line" />
        <path d="M 38 34 Q 50 42 62 34" stroke="#60a5fa" strokeWidth="1.5" fill="none" opacity="0.4" className="flow-line" />
        
        {/* Destination icon (holders) */}
        <circle cx="90" cy="28" r="8" fill="#10b981" opacity="0.8" stroke="#047857" strokeWidth="1" />
        <text x="90" y="32" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">👥</text>
        
        {/* Flow particles */}
        <circle r="2" fill="#fbbf24" className="flow-particle" style={{ offsetPath: "path('M 38 22 Q 50 30 62 22 L 90 28')", animationDelay: "0s" }} />
        <circle r="2" fill="#fbbf24" className="flow-particle" style={{ offsetPath: "path('M 38 28 Q 50 36 62 28 L 90 28')", animationDelay: "0.4s" }} />
        <circle r="2" fill="#fbbf24" className="flow-particle" style={{ offsetPath: "path('M 38 34 Q 50 42 62 34 L 90 28')", animationDelay: "0.8s" }} />
        
        {/* Per-second indicator */}
        <g className="center-glow">
          <circle cx="60" cy="55" r="2" fill="#ec4899" opacity="0.7" />
        </g>
        <text x="60" y="70" fontSize="9" fill="#ec4899" textAnchor="middle" fontWeight="500">per second</text>
      </svg>
    </div>
  );
}

// Compact portfolio tracking animation
function PortfolioAnimation() {
  return (
    <div className="flex justify-center py-1">
      <svg width="90" height="60" viewBox="0 0 120 80" className="overflow-visible scale-90">
        <style>{`
          @keyframes barRise {
            0%, 100% { height: 10px; }
            50% { height: 25px; }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          .bar { animation: barRise 2s ease-in-out infinite; }
          .glow-circle {
            animation: glowPulse 1.5s ease-in-out infinite;
          }
          .chain-badge {
            animation: glowPulse 2s ease-in-out infinite;
          }
        `}</style>
        
        {/* Chart bars */}
        <g>
          <rect x="15" y="45" width="12" height="10" fill="#3b82f6" rx="2" className="bar" style={{ animationDelay: "0s" }} opacity="0.8" />
          <rect x="35" y="45" width="12" height="10" fill="#10b981" rx="2" className="bar" style={{ animationDelay: "0.3s" }} opacity="0.8" />
          <rect x="55" y="45" width="12" height="10" fill="#f59e0b" rx="2" className="bar" style={{ animationDelay: "0.6s" }} opacity="0.8" />
          <rect x="75" y="45" width="12" height="10" fill="#ec4899" rx="2" className="bar" style={{ animationDelay: "0.9s" }} opacity="0.8" />
          <rect x="95" y="45" width="12" height="10" fill="#8b5cf6" rx="2" className="bar" style={{ animationDelay: "1.2s" }} opacity="0.8" />
        </g>
        
        {/* Chain indicators */}
        <circle cx="25" cy="20" r="6" fill="#3b82f6" className="chain-badge" opacity="0.6" />
        <text x="25" y="23" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">B</text>
        
        <circle cx="50" cy="15" r="6" fill="#10b981" className="chain-badge" opacity="0.6" style={{ animationDelay: "0.3s" }} />
        <text x="50" y="18" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">O</text>
        
        <circle cx="75" cy="20" r="6" fill="#f59e0b" className="chain-badge" opacity="0.6" style={{ animationDelay: "0.6s" }} />
        <text x="75" y="23" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">A</text>
        
        {/* Axis lines */}
        <line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <line x1="10" y1="60" x2="10" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      </svg>
    </div>
  );
}

export function MiniAppTutorialModal({
  isOpen,
  onClose,
  onSkip,
}: MiniAppTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "🚀 Launch",
      icon: "🪙",
      content: (
        <div className="space-y-2 text-center">
          <LaunchCoinAnimation />
          <p className="text-[11px] text-base-content/80">
            Deploy on <span className="font-semibold">Base, Optimism, Arbitrum, Polygon, or Ethereum</span>
          </p>
          <p className="text-[11px] text-base-content/80">
            <span className="font-semibold">Superfluid streams</span> earnings to your community
          </p>
        </div>
      ),
    },

    {
      title: "💰 Stream",
      icon: "⚡",
      content: (
        <div className="space-y-2 text-center">
          <StreamFlowAnimation />
          <p className="text-[11px] text-base-content/80">
            Earnings flow <span className="font-semibold">every second</span> to coin holders
          </p>
          <p className="text-[11px] text-base-content/80">
            <span className="font-semibold">No claiming</span> - trustless, automatic payouts
          </p>
        </div>
      ),
    },
    {
      title: "📊 Track",
      icon: "📈",
      content: (
        <div className="space-y-2 text-center">
          <PortfolioAnimation />
          <p className="text-[11px] text-base-content/80">
            Monitor coins across <span className="font-semibold">5 EVM chains</span>
          </p>
          <p className="text-[11px] text-base-content/80">
            Real-time <span className="font-semibold">P&L, holdings, earnings</span> tracking
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-3 space-y-2 max-w-xs mx-auto">
        {/* Header - centered */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-center flex-1">{steps[currentStep].title} YouBuidl</h3>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle btn-sm flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Progress dots - centered */}
        <div className="flex gap-0.5 justify-center">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-0.5 w-6 rounded-full transition-colors ${
                index <= currentStep ? "bg-primary" : "bg-base-300"
              }`}
            />
          ))}
        </div>

        {/* Content - centered */}
        <div className="min-h-[130px] flex items-center justify-center">{steps[currentStep].content}</div>

        {/* Navigation - centered */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {currentStep > 0 ? (
            <button onClick={handleBack} className="btn btn-ghost btn-xs">
              ←
            </button>
          ) : (
            <button disabled className="btn btn-ghost btn-xs opacity-0">
              ←
            </button>
          )}

          <div className="flex gap-0.5">
            {currentStep < steps.length - 1 && (
              <button onClick={handleSkip} className="btn btn-ghost btn-xs text-[10px]">
                Skip
              </button>
            )}
            <button onClick={handleNext} className="btn btn-primary btn-xs text-[10px]">
              {currentStep === steps.length - 1 ? "Start" : "Next"}
            </button>
          </div>
        </div>

        {/* Step indicator - centered */}
        <div className="text-center text-[8px] text-base-content/30">
          {currentStep + 1}/{steps.length}
        </div>
      </div>
    </Modal>
  );
}
