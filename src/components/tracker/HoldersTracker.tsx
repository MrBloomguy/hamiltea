"use client";

import { useState } from "react";
import { HolderInfo, groupHoldersByType, calculateWalletScore } from "../../lib/walletActivity";

interface HoldersTrackerProps {
  tokenAddress: string;
  holders: HolderInfo[];
  isLoading?: boolean;
}

type FilterType = "all" | "dev" | "insider" | "sniper" | "smart_wallet" | "bot" | "regular";

const FILTER_OPTIONS: Array<{ label: string; value: FilterType }> = [
  { label: "All Holders", value: "all" },
  { label: "Dev Wallet", value: "dev" },
  { label: "Insider", value: "insider" },
  { label: "Sniper Wallets", value: "sniper" },
  { label: "Smart Wallets", value: "smart_wallet" },
  { label: "Bot Users", value: "bot" },
  { label: "Regular", value: "regular" },
];

const HOLDER_TYPE_COLORS: Record<HolderInfo["holderType"], string> = {
  dev: "bg-red-500/20 text-red-700 border-red-300",
  insider: "bg-purple-500/20 text-purple-700 border-purple-300",
  sniper: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
  smart_wallet: "bg-blue-500/20 text-blue-700 border-blue-300",
  bot: "bg-gray-500/20 text-gray-700 border-gray-300",
  regular: "bg-green-500/20 text-green-700 border-green-300",
};

export function HoldersTracker({
  tokenAddress,
  holders,
  isLoading = false,
}: HoldersTrackerProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"holding" | "score" | "transactions">(
    "holding"
  );

  const filteredHolders =
    selectedFilter === "all"
      ? holders
      : holders.filter((h) => h.holderType === selectedFilter);

  const sortedHolders = [...filteredHolders].sort((a, b) => {
    switch (sortBy) {
      case "holding":
        return parseFloat(b.balance) - parseFloat(a.balance);
      case "score":
        return calculateWalletScore(b) - calculateWalletScore(a);
      case "transactions":
        return b.transactionCount - a.transactionCount;
      default:
        return 0;
    }
  });

  const groupedHolders = groupHoldersByType(holders);
  const totalHolders = holders.length;

  if (isLoading) {
    return <div className="text-muted-foreground">Loading holders...</div>;
  }

  if (holders.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground">No holder data available yet</p>
      </div>
    );
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Holder Summary */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Holders Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Holders</p>
            <p className="text-xl font-bold mt-1">{totalHolders}</p>
          </div>

          {(["dev", "insider", "sniper", "smart_wallet", "bot", "regular"] as const).map(
            (type) => (
              <div key={type} className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground capitalize">
                  {type.replace(/_/g, " ")}
                </p>
                <p className="text-xl font-bold mt-1">{groupedHolders[type].length}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Filter by Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedFilter(option.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedFilter === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Sort By</label>
          <div className="flex gap-2">
            {(["holding", "score", "transactions"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  sortBy === option
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary"
                }`}
              >
                {option === "holding" && "Holding Size"}
                {option === "score" && "Wallet Score"}
                {option === "transactions" && "Transactions"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Holders List */}
      <div className="space-y-3">
        {sortedHolders.map((holder) => {
          const walletScore = calculateWalletScore(holder);
          const isLargeHolder = holder.percentage > 5;

          return (
            <div
              key={holder.address}
              className={`bg-card rounded-lg border p-4 transition-all ${
                isLargeHolder ? "border-yellow-400 bg-yellow-50/5" : "border-border"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <a
                    href={`https://etherscan.io/address/${holder.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm hover:text-primary transition-colors"
                  >
                    {shortenAddress(holder.address)}
                  </a>

                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded border text-xs font-semibold ${HOLDER_TYPE_COLORS[holder.holderType]}`}>
                      {holder.holderType.replace(/_/g, " ")}
                    </span>

                    {isLargeHolder && (
                      <span className="px-2 py-1 rounded border border-yellow-400 bg-yellow-500/20 text-yellow-700 text-xs font-semibold">
                        Large Holder ({holder.percentage.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">{walletScore}</p>
                  <p className="text-xs text-muted-foreground">score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="font-mono font-semibold">
                    {parseFloat(holder.balanceFormatted).toFixed(4)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Percentage</p>
                  <p className="font-semibold">{holder.percentage.toFixed(2)}%</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="font-semibold">{holder.transactionCount}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Active</p>
                  <p className="text-xs">
                    {new Date(holder.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredHolders.length === 0 && (
        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <p className="text-muted-foreground">
            No holders found for this filter
          </p>
        </div>
      )}
    </div>
  );
}
