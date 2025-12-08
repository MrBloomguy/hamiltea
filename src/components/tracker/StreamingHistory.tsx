"use client";

import { useEffect, useState } from "react";
import { type StreamData } from "../../lib/streamingAnalytics";
import { formatFlowRate, formatDuration } from "../../lib/streamingAnalytics";

interface StreamingHistoryProps {
  walletAddress: string;
  streams: StreamData[];
  isLoading?: boolean;
}

interface StreamHistory extends StreamData {
  totalAmount: number;
  endedAt?: number;
}

export function StreamingHistory({
  walletAddress,
  streams,
  isLoading = false,
}: StreamingHistoryProps) {
  const [history, setHistory] = useState<StreamHistory[]>([]);
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "duration">("date");

  useEffect(() => {
    let filtered = streams.map((stream) => ({
      ...stream,
      totalAmount:
        (parseFloat(stream.flowRate) / Math.pow(10, 18)) *
        ((stream.endTime || Date.now()) - stream.startTime) /
        1000,
    }));

    // Filter
    if (filterType === "sent") {
      filtered = filtered.filter((s) => s.sender.toLowerCase() === walletAddress.toLowerCase());
    } else if (filterType === "received") {
      filtered = filtered.filter((s) => s.receiver.toLowerCase() === walletAddress.toLowerCase());
    }

    // Sort
    if (sortBy === "amount") {
      filtered.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === "duration") {
      filtered.sort((a, b) => (b.endTime || Date.now()) - b.startTime - ((a.endTime || Date.now()) - a.startTime));
    } else {
      filtered.sort((a, b) => b.startTime - a.startTime);
    }

    setHistory(filtered);
  }, [streams, filterType, sortBy, walletAddress]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded border border-border p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card rounded border border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          {filterType === "all"
            ? "No streaming history"
            : filterType === "sent"
              ? "No streams sent"
              : "No streams received"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-2 text-sm rounded border transition-colors ${
              filterType === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("sent")}
            className={`px-3 py-2 text-sm rounded border transition-colors ${
              filterType === "sent"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilterType("received")}
            className={`px-3 py-2 text-sm rounded border transition-colors ${
              filterType === "received"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            Received
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "duration")}
          className="px-3 py-2 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="date">Recent</option>
          <option value="amount">Amount</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-background/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Token
                </th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                  Flow Rate
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                  Duration
                </th>
                <th className="px-6 py-3 text-center font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((stream) => {
                const isSent =
                  stream.sender.toLowerCase() === walletAddress.toLowerCase();
                const duration = (stream.endTime || Date.now()) - stream.startTime;

                return (
                  <tr
                    key={`${stream.tokenAddress}-${stream.sender}-${stream.receiver}-${stream.startTime}`}
                    className="border-b border-border/30 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium">{stream.tokenSymbol}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          isSent
                            ? "bg-red-500/20 text-red-600"
                            : "bg-green-500/20 text-green-600"
                        }`}
                      >
                        {isSent ? "Sent" : "Received"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-xs">
                      {formatFlowRate(stream.flowRate, 18, "day")}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {stream.totalAmount.toFixed(4)} {stream.tokenSymbol}
                    </td>
                    <td className="px-6 py-3 text-right text-xs">
                      {formatDuration(duration / 1000)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          stream.isActive
                            ? "bg-green-500/20 text-green-600"
                            : "bg-gray-500/20 text-gray-600"
                        }`}
                      >
                        {stream.isActive ? "Active" : "Ended"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Total Sent</p>
          <p className="text-xl font-bold">
            {history
              .filter((s) => s.sender.toLowerCase() === walletAddress.toLowerCase())
              .reduce((sum, s) => sum + s.totalAmount, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Total Received</p>
          <p className="text-xl font-bold">
            {history
              .filter((s) => s.receiver.toLowerCase() === walletAddress.toLowerCase())
              .reduce((sum, s) => sum + s.totalAmount, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Total Streams</p>
          <p className="text-xl font-bold">{history.length}</p>
        </div>
      </div>
    </div>
  );
}
