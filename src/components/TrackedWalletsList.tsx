"use client";

import { useEffect, useState } from "react";
import { fetchWalletTokenHoldings, TokenHolding } from "../lib/tokenHoldings";
import { TrackedWallet } from "../app/tracker/page";

interface TrackedWalletsListProps {
  wallets: TrackedWallet[];
  onRemoveWallet: (address: string) => void;
  onUpdateWalletChains?: (address: string, chains: string[]) => void;
  defaultChains?: string[];
}

interface WalletDisplay {
  wallet: TrackedWallet;
  holdings: TokenHolding[];
  isLoading: boolean;
}

export function TrackedWalletsList({
  wallets,
  onRemoveWallet,
  onUpdateWalletChains,
  defaultChains = ["base"],
}: TrackedWalletsListProps) {
  const [walletsData, setWalletsData] = useState<Record<string, WalletDisplay>>({});

  useEffect(() => {
    const fetchWalletsData = async () => {
      const data: Record<string, WalletDisplay> = {};

      for (const wallet of wallets) {
        data[wallet.address] = {
          wallet,
          holdings: [],
          isLoading: true,
        };
      }

      setWalletsData(data);

      // Fetch holdings for each wallet and chain
      for (const wallet of wallets) {
        const chainsToFetch = wallet.selectedChains && wallet.selectedChains.length > 0
          ? wallet.selectedChains
          : defaultChains;

        try {
          const allHoldings: TokenHolding[] = [];

          for (const chain of chainsToFetch) {
            const holdings = await fetchWalletTokenHoldings(wallet.address, chain);
            allHoldings.push(...holdings);
          }

          setWalletsData((prev) => ({
            ...prev,
            [wallet.address]: {
              ...prev[wallet.address],
              holdings: allHoldings,
              isLoading: false,
            },
          }));
        } catch (error) {
          console.error(`Failed to fetch holdings for ${wallet.address}:`, error);
          setWalletsData((prev) => ({
            ...prev,
            [wallet.address]: {
              ...prev[wallet.address],
              isLoading: false,
            },
          }));
        }
      }
    };

    if (wallets.length > 0) {
      fetchWalletsData();
    }
  }, [wallets, defaultChains]);

  if (Object.keys(walletsData).length === 0) {
    return null;
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const groupHoldingsByChain = (holdings: TokenHolding[]) => {
    const grouped: Record<string, TokenHolding[]> = {};
    for (const holding of holdings) {
      if (!grouped[holding.chainId]) {
        grouped[holding.chainId] = [];
      }
      grouped[holding.chainId].push(holding);
    }
    return grouped;
  };

  return (
    <div className="flex flex-col h-full">
      {wallets.map((wallet) => {
        const data = walletsData[wallet.address];
        if (!data) return null;

        const holdingsByChain = groupHoldingsByChain(data.holdings);
        const totalValue = data.holdings.reduce((sum, h) => sum + (h.balanceUSD || 0), 0);

        return (
          <div key={wallet.address} className="flex flex-col flex-1 overflow-hidden">
            {/* Wallet Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-background/50">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{shortenAddress(wallet.address)}</span>
                    {wallet.label && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {wallet.label}
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://etherscan.io/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View on Etherscan
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-semibold">${totalValue.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => onRemoveWallet(wallet.address)}
                  className="px-3 py-1.5 bg-destructive/10 text-destructive rounded text-xs font-medium hover:bg-destructive/20 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Tokens Table */}
            {data.isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="space-y-2 w-full px-6">
                  <div className="h-3 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ) : data.holdings.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No holdings found
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                {/* Headers */}
                <div className="sticky top-0 grid grid-cols-12 gap-4 px-6 py-2 bg-background border-b border-border/50 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-3">Token</div>
                  <div className="col-span-2">Chain</div>
                  <div className="col-span-2 text-right">Balance</div>
                  <div className="col-span-3 text-right">Value</div>
                  <div className="col-span-2 text-right">Address</div>
                </div>

                {/* Rows */}
                {Object.entries(holdingsByChain).map(([chainId, tokens]) =>
                  tokens.map((token) => (
                    <div
                      key={`${chainId}-${token.address}`}
                      className="grid grid-cols-12 gap-4 px-6 py-2.5 border-b border-border/30 hover:bg-background/50 transition-colors text-sm"
                    >
                      <div className="col-span-3 flex items-center">
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center capitalize text-muted-foreground">
                        {chainId === "ethereum" ? "ETH" : chainId}
                      </div>
                      <div className="col-span-2 text-right font-mono font-medium">
                        {parseFloat(token.balanceFormatted).toFixed(4)}
                      </div>
                      <div className="col-span-3 text-right font-semibold">
                        ${(token.balanceUSD || 0).toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right">
                        <a
                          href={`https://etherscan.io/token/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {token.address.slice(0, 6)}...
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
