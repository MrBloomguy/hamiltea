"use client";

import { Modal } from "./Modal";
import { useState } from "react";
import { TutorialStreamingAnimation } from "./TutorialStreamingAnimation";
import { GrowthFundAnimation } from "./GrowthFundAnimation";

interface MiniAppTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export function MiniAppTutorialModal({
  isOpen,
  onClose,
  onSkip,
}: MiniAppTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "🚀 Create Your Creator Coin",
      content: (
        <div className="space-y-3">
          <TutorialStreamingAnimation />

          <p className="text-sm text-base-content/80">
            Launch tokens on Base, Optimism, Arbitrum, Polygon, or Ethereum.
          </p>

          <p className="text-sm text-base-content/80">
            Built-in staking and Superfluid streaming for real-time payments.
          </p>
        </div>
      ),
    },

    {
      title: "💰 Stream Daily Earnings",
      content: (
        <div className="space-y-3">
          <GrowthFundAnimation contributorCount={25} growthRate={2.5} />

          <p className="text-sm text-base-content/80">
            Set a stream rate → earnings flow continuously, per second.
          </p>
          <p className="text-sm text-base-content/80">
            20% of your token supply distributed to community over 365 days.
          </p>
        </div>
      ),
    },
    {
      title: "📊 Track Your Portfolio",
      content: (
        <div className="space-y-3">
          <div className="flex justify-center mb-2">
            <svg className="w-16 h-16 text-[var(--lime-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </div>
          <p className="text-sm text-base-content/80">
            Monitor multiple wallets and creator coins across all EVM chains.
          </p>
          <p className="text-sm text-base-content/80">
            View P&L, transaction history, and portfolio metrics in real-time.
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
      <div className="p-4 space-y-4 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">{steps[currentStep].title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            ✕
          </button>
        </div>

        {/* Progress indicator - Ultra compact */}
        <div className="flex items-center gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-primary" : "bg-base-300"
              }`}
            />
          ))}
        </div>

        {/* Content - Compact */}
        <div className="min-h-[240px]">{steps[currentStep].content}</div>

        {/* Navigation - Compact */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {currentStep > 0 && (
              <button onClick={handleBack} className="btn btn-ghost btn-xs">
                ← Back
              </button>
            )}
          </div>

          <div className="flex gap-1">
            {currentStep < steps.length - 1 && (
              <button onClick={handleSkip} className="btn btn-ghost btn-xs">
                Skip
              </button>
            )}
            <button onClick={handleNext} className="btn btn-primary btn-xs">
              {currentStep === steps.length - 1 ? "Start!" : "Next"}
            </button>
          </div>
        </div>

        {/* Step indicator - Minimal */}
        <div className="text-center text-[10px] text-base-content/50">
          {currentStep + 1}/{steps.length}
        </div>
      </div>
    </Modal>
  );
}
