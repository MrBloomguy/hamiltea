"use client";

import { useEffect } from "react";

interface HowCrowdfundWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMiniApp?: boolean;
}

export function HowCrowdfundWorksModal({
  isOpen,
  onClose,
  isMiniApp = false,
}: HowCrowdfundWorksModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isMiniApp ? "flex items-end" : "flex items-center justify-center"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-base-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl border border-base-300 ${
          isMiniApp ? "w-full rounded-t-xl" : "rounded-xl max-w-md mx-4"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">How YouBuidl Streaming Works</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-base mb-2">🌊 Creator Coins</h3>
            <p className="text-sm text-base-content/70">
              Launch your own coin on Base, Optimism, Arbitrum, Polygon, or Ethereum. 
              Simple setup, no complex contracts needed.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-2">💸 Stream Earnings</h3>
            <p className="text-sm text-base-content/70">
              Stream a portion of your daily earnings directly to all coin holders in real-time. 
              Earnings flow per-second using Superfluid - automatic, transparent, and trustless.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-2">💰 Community Rewards</h3>
            <p className="text-sm text-base-content/70">
              Coin holders earn automatically - no claiming needed. Your share flows continuously, 
              building loyalty and engagement with your community.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-2">📊 Track Everything</h3>
            <p className="text-sm text-base-content/70">
              Use YouBuidl's portfolio tracker to monitor creator coins you&apos;ve invested in. 
              See real-time P&L, transaction history, and earnings across all EVM chains.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-base-300">
          <button onClick={onClose} className="btn btn-primary w-full">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
