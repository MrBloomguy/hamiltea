"use client";

import { useEffect, useState } from "react";
import {
  calculateStreamingStats,
  calculateFlowRateMetrics,
  formatFlowRate,
  formatDuration,
  estimateStreamDuration,
  type StreamData,
  type StreamingStats,
} from "../../lib/streamingAnalytics";

interface StreamingDashboardProps {
  walletAddress: string;
  streams: StreamData[];
  isLoading?: boolean;
}

export function StreamingDashboard({
  walletAddress,
  streams,
  isLoading = false,
}: StreamingDashboardProps) {
  const [stats, setStats] = useState<StreamingStats | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);

  useEffect(() => {
    if (streams.length > 0) {
      const calculatedStats = calculateStreamingStats(streams);
      setStats(calculatedStats);
      if (calculatedStats.topStream && !selectedStream) {
        setSelectedStream(calculatedStats.topStream);
      }
    }
  }, [streams, selectedStream]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded border border-border p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || streams.length === 0) {
    return (
      <div className="bg-card rounded border border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">No active streams</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Streams */}
        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Streams</p>
          <p className="text-2xl font-bold">{stats.totalActiveStreams}</p>
          <p className="text-xs text-primary mt-2">
            {streams.length - stats.totalActiveStreams} inactive
          </p>
        </div>

        {/* Daily Income */}
        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Daily Income</p>
          <p className="text-2xl font-bold">
            ${stats.totalDailyIncome.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-2">
            {stats.totalFlowRatePerSecond.toFixed(6)}/sec
          </p>
        </div>

        {/* Monthly Projection */}
        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Monthly Projection</p>
          <p className="text-2xl font-bold">
            ${stats.totalMonthlyProjection.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            30-day estimate
          </p>
        </div>

        {/* Average Flow Rate */}
        <div className="bg-card rounded border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Flow Rate</p>
          <p className="text-2xl font-bold">
            {stats.averageFlowRate.toFixed(8)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">per active stream</p>
        </div>
      </div>

      {/* Top Stream Highlight */}
      {stats.topStream && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20 p-6">
          <h3 className="font-semibold mb-4">Top Stream</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Token</p>
              <p className="text-lg font-bold">{stats.topStream.tokenSymbol}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Flow Rate</p>
              <p className="text-lg font-bold font-mono">
                {formatFlowRate(stats.topStream.flowRate, 18, "day")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-bold">
                {Math.floor(
                  (Date.now() - stats.topStream.startTime) / (1000 * 86400)
                )}
                d
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Streams Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-background/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Token
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                  Flow Rate
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                  Daily Amount
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
              {streams.map((stream) => {
                const durationSeconds = estimateStreamDuration(
                  stream.flowRate,
                  stream.flowRate
                );
                return (
                  <tr
                    key={`${stream.tokenAddress}-${stream.sender}-${stream.receiver}`}
                    className="border-b border-border/30 hover:bg-background/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStream(stream)}
                  >
                    <td className="px-6 py-3 font-medium">{stream.tokenSymbol}</td>
                    <td className="px-6 py-3 text-right font-mono text-xs">
                      {formatFlowRate(stream.flowRate, 18, "day")}
                    </td>
                    <td className="px-6 py-3 text-right font-mono">
                      ${(
                        (parseFloat(stream.flowRate) / Math.pow(10, 18)) *
                        86400
                      ).toFixed(4)}
                    </td>
                    <td className="px-6 py-3 text-right text-xs">
                      {Math.floor(
                        (Date.now() - stream.startTime) / (1000 * 86400)
                      )}
                      d
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          stream.isActive
                            ? "bg-green-500/20 text-green-600"
                            : "bg-gray-500/20 text-gray-600"
                        }`}
                      >
                        {stream.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Stream Details */}
      {selectedStream && (
        <div className="bg-card rounded border border-border p-6 space-y-4">
          <h3 className="font-semibold text-lg">Stream Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Token</p>
              <p className="text-xl font-bold">{selectedStream.tokenSymbol}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Flow Rate</p>
              <p className="text-xl font-bold font-mono">
                {formatFlowRate(selectedStream.flowRate, 18, "day")}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Started</p>
              <p className="text-sm">
                {new Date(selectedStream.startTime).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Active For</p>
              <p className="text-sm">
                {Math.floor(
                  (Date.now() - selectedStream.startTime) / (1000 * 86400)
                )}{" "}
                days
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">From</p>
              <p className="text-xs font-mono">
                {selectedStream.sender.slice(0, 6)}...
                {selectedStream.sender.slice(-4)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">To</p>
              <p className="text-xs font-mono">
                {selectedStream.receiver.slice(0, 6)}...
                {selectedStream.receiver.slice(-4)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Per Hour</p>
              <p className="font-semibold">
                {formatFlowRate(selectedStream.flowRate, 18, "hour")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Per Day</p>
              <p className="font-semibold">
                {formatFlowRate(selectedStream.flowRate, 18, "day")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Per Month</p>
              <p className="font-semibold">
                {(
                  (parseFloat(selectedStream.flowRate) / Math.pow(10, 18)) *
                  86400 *
                  30
                ).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
