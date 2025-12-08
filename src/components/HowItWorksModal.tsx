"use client";

export function HowItWorksModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-base-100 w-full max-w-lg mx-4 p-8 shadow-xl border border-black/[.1] dark:border-white/[.1]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6">How YouBuidl Works</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">
              🌊 Creators Launch Coins
            </h3>
            <p className="opacity-80">
              Builders and creators launch their own tokens on EVM networks (Base, Optimism, Arbitrum, Polygon, Ethereum). 
              No complex smart contracts needed - simple, straightforward coin creation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary">
              💰 Stream Daily Earnings
            </h3>
            <p className="opacity-80">
              Creators stream a portion of their daily earnings (in real-time, per-second) to all coin holders using Superfluid. 
              If you hold a creator&apos;s coin, you earn automatically - no claiming needed.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-accent">
              📊 Track Your Investments
            </h3>
            <p className="opacity-80">
              The portfolio tracker helps you monitor all creator coins you own across multiple wallets. 
              See real-time P&L, transaction history, and performance analytics for each creator coin investment.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-info">
              ✨ Multi-Chain Support
            </h3>
            <p className="opacity-80">
              YouBuidl supports Base, Optimism, Arbitrum, Polygon, and Ethereum. 
              Track creator coins and earnings across all EVM networks from one dashboard.
            </p>
          </div>

          {/* Add docs link */}
          <div className="text-center pt-4">
            <a
              href="https://github.com/kowksicoder/hamiltea/blob/main/README_YOUBUIDL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Read the full documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}