"use client";

import { SUPPORTED_CHAINS } from "../../lib/multiChainClient";

interface ChainSelectorProps {
  selectedChains: string[];
  onChainsChange: (chains: string[]) => void;
}

const CHAIN_DISPLAY_NAMES: Record<string, string> = {
  base: "Base",
  ethereum: "Ethereum",
  optimism: "Optimism",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
};

const CHAIN_COLORS: Record<string, string> = {
  base: "bg-blue-500/20 text-blue-700 border-blue-300",
  ethereum: "bg-purple-500/20 text-purple-700 border-purple-300",
  optimism: "bg-red-500/20 text-red-700 border-red-300",
  arbitrum: "bg-blue-600/20 text-blue-800 border-blue-400",
  polygon: "bg-purple-600/20 text-purple-800 border-purple-400",
};

export function ChainSelector({ selectedChains, onChainsChange }: ChainSelectorProps) {
  const toggleChain = (chainKey: string) => {
    if (selectedChains.includes(chainKey)) {
      onChainsChange(selectedChains.filter((c) => c !== chainKey));
    } else {
      onChainsChange([...selectedChains, chainKey]);
    }
  };

  const chains = Object.keys(SUPPORTED_CHAINS);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold mb-4">Select Chains to Track</h2>
      <div className="flex flex-wrap gap-3">
        {chains.map((chainKey) => (
          <button
            key={chainKey}
            onClick={() => toggleChain(chainKey)}
            className={`px-4 py-2 rounded-lg border font-medium transition-all ${
              selectedChains.includes(chainKey)
                ? `${CHAIN_COLORS[chainKey]} border-2`
                : "bg-background border border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {CHAIN_DISPLAY_NAMES[chainKey]}
          </button>
        ))}
      </div>
      {selectedChains.length === 0 && (
        <p className="text-sm text-yellow-600 mt-3">
          ⚠️ Select at least one chain to track
        </p>
      )}
    </div>
  );
}
