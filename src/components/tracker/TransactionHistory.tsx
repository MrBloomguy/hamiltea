"use client";

import { useEffect, useState } from "react";
import {
  fetchCompleteWalletHistory,
  cacheWalletHistory,
  getCachedWalletHistory,
  TransactionRecord,
} from "../../lib/transactionHistory";

interface TransactionHistoryProps {
  walletAddress: string;
  chainId: string;
  limit?: number;
}

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  swap: "bg-blue-500/20 text-blue-700 border-blue-300",
  approve: "bg-gray-500/20 text-gray-700 border-gray-300",
  send: "bg-red-500/20 text-red-700 border-red-300",
  receive: "bg-green-500/20 text-green-700 border-green-300",
  other: "bg-purple-500/20 text-purple-700 border-purple-300",
};

export function TransactionHistory({
  walletAddress,
  chainId,
  limit = 20,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try cache first
        const cached = getCachedWalletHistory(walletAddress, chainId);
        if (cached) {
          setTransactions(cached.slice(0, limit));
          setIsLoading(false);
          return;
        }

        // Fetch from APIs
        const txs = await fetchCompleteWalletHistory(walletAddress, chainId);

        if (txs.length === 0) {
          setError("No transactions found");
        } else {
          setTransactions(txs.slice(0, limit));
          cacheWalletHistory(walletAddress, chainId, txs);
        }
      } catch (err) {
        console.error("Failed to fetch transaction history:", err);
        setError("Failed to load transaction history");
      } finally {
        setIsLoading(false);
      }
    };

    if (walletAddress && chainId) {
      fetchHistory();
    }
  }, [walletAddress, chainId, limit]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toFixed(4);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
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

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm">No transaction history available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table Headers */}
      <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-background border-b border-border text-xs font-semibold text-muted-foreground sticky top-0 z-10">
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-2">From</div>
        <div className="col-span-2">To</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2 text-right">Hash</div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-auto">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="grid grid-cols-12 gap-4 px-6 py-2.5 border-b border-border/50 hover:bg-background/50 transition-colors text-sm items-center"
          >
            {/* Type */}
            <div className="col-span-2">
              <span
                className={`px-2 py-1 rounded border text-xs font-semibold inline-block ${TRANSACTION_TYPE_COLORS[tx.transactionType]}`}
              >
                {tx.transactionType.charAt(0).toUpperCase() + tx.transactionType.slice(1)}
              </span>
            </div>

            {/* Time */}
            <div className="col-span-2 text-muted-foreground text-xs">
              {new Date(tx.timestamp).toLocaleDateString()}
            </div>

            {/* From */}
            <div className="col-span-2 font-mono text-xs">
              <a
                href={`https://${getExplorerDomain(tx.chainId)}/address/${tx.from}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {shortenAddress(tx.from)}
              </a>
            </div>

            {/* To */}
            <div className="col-span-2 font-mono text-xs">
              <a
                href={`https://${getExplorerDomain(tx.chainId)}/address/${tx.to}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {shortenAddress(tx.to)}
              </a>
            </div>

            {/* Amount */}
            <div className="col-span-2 font-mono font-semibold">
              {tx.tokenSymbol ? (
                <span className={tx.transactionType === "receive" ? "text-green-600" : "text-red-600"}>
                  {tx.transactionType === "receive" ? "+" : "-"}
                  {formatValue(tx.tokenAmount || "0")} {tx.tokenSymbol}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>

            {/* Hash Link */}
            <div className="col-span-2 text-right">
              <a
                href={`https://${getExplorerDomain(tx.chainId)}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs font-mono"
              >
                {shortenAddress(tx.hash)}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getExplorerDomain(chainId: string): string {
  const explorers: Record<string, string> = {
    ethereum: "etherscan.io",
    base: "basescan.org",
    optimism: "optimistic.etherscan.io",
    arbitrum: "arbiscan.io",
    polygon: "polygonscan.com",
  };
  return explorers[chainId] || "etherscan.io";
}
