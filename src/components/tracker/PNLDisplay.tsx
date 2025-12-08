"use client";

import { useEffect, useState } from "react";
import {
  calculatePortfolioPNL,
  cachePNLData,
  getCachedPNL,
  PortfolioPNL,
} from "../../lib/pnlCalculator";
import {
  fetchCompleteWalletHistory,
  getCachedWalletHistory,
} from "../../lib/transactionHistory";

interface PNLDisplayProps {
  walletAddress: string;
  chainId: string;
}

export function PNLDisplay({ walletAddress, chainId }: PNLDisplayProps) {
  const [pnl, setPNL] = useState<PortfolioPNL | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculatePNL = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try cache first
        const cached = getCachedPNL(walletAddress, chainId);
        if (cached) {
          setPNL(cached);
          setIsLoading(false);
          return;
        }

        // Get transaction history
        let transactions = getCachedWalletHistory(walletAddress, chainId);
        if (!transactions) {
          transactions = await fetchCompleteWalletHistory(walletAddress, chainId);
        }

        if (!transactions || transactions.length === 0) {
          setError("No transaction history found");
          setIsLoading(false);
          return;
        }

        // Calculate PNL
        const calculatedPNL = await calculatePortfolioPNL(transactions);

        setPNL(calculatedPNL);
        cachePNLData(walletAddress, chainId, calculatedPNL);
      } catch (err) {
        console.error("Failed to calculate PNL:", err);
        setError("Failed to calculate P&L");
      } finally {
        setIsLoading(false);
      }
    };

    if (walletAddress && chainId) {
      calculatePNL();
    }
  }, [walletAddress, chainId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTextColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (!pnl || pnl.tokens.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm">No P&L data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 px-6 py-4 border-b border-border bg-background/50">
        <div className="bg-card rounded border border-border/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="text-lg font-bold">${pnl.totalValue.toFixed(2)}</p>
        </div>

        <div className="bg-card rounded border border-border/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
          <p className="text-lg font-bold">${pnl.totalCost.toFixed(2)}</p>
        </div>

        <div className={`bg-card rounded border border-border/50 p-3 ${getTextColor(pnl.unrealizedPNL)}`}>
          <p className="text-xs text-muted-foreground mb-1">Unrealized P&L</p>
          <p className="text-lg font-bold">${pnl.unrealizedPNL.toFixed(2)}</p>
          <p className="text-xs mt-0.5">{pnl.unrealizedPNLPercent.toFixed(2)}%</p>
        </div>

        <div className={`bg-card rounded border border-border/50 p-3 ${getTextColor(pnl.realizedPNL)}`}>
          <p className="text-xs text-muted-foreground mb-1">Realized P&L</p>
          <p className="text-lg font-bold">${pnl.realizedPNL.toFixed(2)}</p>
        </div>
      </div>

      {/* Token Table Headers */}
      <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-background border-b border-border text-xs font-semibold text-muted-foreground sticky top-0 z-10">
        <div className="col-span-2">Token</div>
        <div className="col-span-1 text-right">Qty</div>
        <div className="col-span-2 text-right">Entry Price</div>
        <div className="col-span-2 text-right">Current Price</div>
        <div className="col-span-2 text-right">Value</div>
        <div className="col-span-1 text-right">P&L</div>
      </div>

      {/* Token Rows */}
      <div className="flex-1 overflow-auto">
        {pnl.tokens.map((token) => (
          <div
            key={`${token.tokenAddress}-${token.chainId}`}
            className={`grid grid-cols-12 gap-4 px-6 py-2.5 border-b border-border/50 hover:bg-background/50 transition-colors text-sm items-center ${
              token.unrealizedPNL >= 0 ? "bg-green-500/5" : "bg-red-500/5"
            }`}
          >
            {/* Token */}
            <div className="col-span-2">
              <div>
                <p className="font-medium">{token.symbol}</p>
                <a
                  href={`https://etherscan.io/token/${token.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-mono"
                >
                  {token.tokenAddress.slice(0, 6)}...
                </a>
              </div>
            </div>

            {/* Quantity */}
            <div className="col-span-1 text-right font-mono">
              {token.quantity.toFixed(4)}
            </div>

            {/* Entry Price */}
            <div className="col-span-2 text-right font-mono">
              ${token.averageEntryPrice.toFixed(4)}
            </div>

            {/* Current Price */}
            <div className="col-span-2 text-right font-mono font-semibold">
              ${token.currentPrice.toFixed(4)}
            </div>

            {/* Value */}
            <div className="col-span-2 text-right font-mono font-semibold">
              ${token.currentValue.toFixed(2)}
            </div>

            {/* P&L */}
            <div className={`col-span-1 text-right font-bold ${getTextColor(token.unrealizedPNL)}`}>
              <div>${Math.abs(token.unrealizedPNL).toFixed(2)}</div>
              <div className="text-xs">{token.unrealizedPNLPercent.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
