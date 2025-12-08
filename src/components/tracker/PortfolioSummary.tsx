"use client";

import { useEffect, useState } from "react";
import { fetchAllChainsTokenHoldings, TokenHolding } from "../../lib/tokenHoldings";
import { TrackedWallet } from "../../app/tracker/page";

interface PortfolioSummaryProps {
  wallets: TrackedWallet[];
  chains: string[];
}

export function PortfolioSummary({ wallets, chains }: PortfolioSummaryProps) {
  const [allHoldings, setAllHoldings] = useState<TokenHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chainBreakdown, setChainBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoading(true);
      const allTokens: TokenHolding[] = [];

      for (const wallet of wallets) {
        // Use wallet's selected chains if available, otherwise use global chains
        const chainsToFetch = wallet.selectedChains && wallet.selectedChains.length > 0
          ? wallet.selectedChains
          : chains;

        try {
          const holdings = await fetchAllChainsTokenHoldings(
            wallet.address,
            chainsToFetch
          );

          for (const chainKey of Object.keys(holdings)) {
            allTokens.push(...holdings[chainKey]);
          }
        } catch (error) {
          console.error(`Failed to fetch holdings for ${wallet.address}:`, error);
        }
      }

      setAllHoldings(allTokens);

      // Calculate breakdown by chain
      const breakdown: Record<string, number> = {};
      for (const holding of allTokens) {
        if (!breakdown[holding.chainId]) {
          breakdown[holding.chainId] = 0;
        }
        breakdown[holding.chainId]++;
      }
      setChainBreakdown(breakdown);
      setIsLoading(false);
    };

    if (wallets.length > 0 && chains.length > 0) {
      fetchHoldings();
    }
  }, [wallets, chains]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background/50 rounded p-4">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-5 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTokens = allHoldings.length;
  const totalWallets = wallets.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground mb-2">Total Wallets</p>
        <p className="text-3xl font-bold">{totalWallets}</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground mb-2">Tracked Chains</p>
        <p className="text-3xl font-bold">{chains.length}</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground mb-2">Unique Tokens</p>
        <p className="text-3xl font-bold">{totalTokens}</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground mb-2">Holdings by Chain</p>
        <div className="space-y-1">
          {Object.entries(chainBreakdown).map(([chain, count]) => (
            <p key={chain} className="text-sm">
              <span className="font-semibold capitalize">{chain}:</span> {count}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
