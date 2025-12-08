"use client";

import { useEffect, useState } from "react";
import {
  PortfolioMetrics,
  generatePortfolioMetrics,
  getPortfolioSnapshots,
  calculateDiversityScore,
  categorizeAssets,
  assessPortfolioRisk,
} from "../../lib/portfolioMetrics";
import { TokenHolding } from "../../lib/tokenHoldings";

interface PortfolioPerformanceProps {
  walletAddress: string;
  holdings: TokenHolding[];
}

export function PortfolioPerformance({
  walletAddress,
  holdings,
}: PortfolioPerformanceProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [diversityScore, setDiversityScore] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState<ReturnType<
    typeof assessPortfolioRisk
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = () => {
      const snapshots = getPortfolioSnapshots(walletAddress);

      if (snapshots.length > 0) {
        const calculatedMetrics = generatePortfolioMetrics(snapshots);
        setMetrics(calculatedMetrics);
      }

      const diversity = calculateDiversityScore(holdings);
      setDiversityScore(diversity);

      const risk = assessPortfolioRisk(holdings);
      setRiskAssessment(risk);

      setIsLoading(false);
    };

    calculateMetrics();
  }, [walletAddress, holdings]);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading performance data...</div>;
  }

  if (!metrics) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm">
          No performance history available yet. Data will be tracked over time.
        </p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getRiskColor = () => {
    if (!riskAssessment) return "text-gray-600";
    switch (riskAssessment.riskLevel) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-red-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value */}
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(metrics.totalValueUSD)}
            </p>
          </div>

          {/* Daily Change */}
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">24h Change</p>
            <p className={`text-2xl font-bold ${getChangeColor(metrics.dayChange)}`}>
              {formatCurrency(metrics.dayChange)}
            </p>
            <p className={`text-xs ${getChangeColor(metrics.dayChangePercent)}`}>
              {formatPercent(metrics.dayChangePercent)}
            </p>
          </div>

          {/* Weekly Change */}
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">7d Change</p>
            <p className={`text-2xl font-bold ${getChangeColor(metrics.weekChange)}`}>
              {formatCurrency(metrics.weekChange)}
            </p>
            <p className={`text-xs ${getChangeColor(metrics.weekChangePercent)}`}>
              {formatPercent(metrics.weekChangePercent)}
            </p>
          </div>

          {/* All-Time Change */}
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">All-Time Change</p>
            <p className={`text-2xl font-bold ${getChangeColor(metrics.allTimeChange)}`}>
              {formatCurrency(metrics.allTimeChange)}
            </p>
            <p className={`text-xs ${getChangeColor(metrics.allTimeChangePercent)}`}>
              {formatPercent(metrics.allTimeChangePercent)}
            </p>
          </div>
        </div>
      </div>

      {/* Trading Statistics */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Trading Statistics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Win Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalTrades} total trades
            </p>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Best Trade</p>
            <p className="text-lg font-bold text-green-600">
              {metrics.bestTrade.gainPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.bestTrade.symbol}
            </p>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Worst Trade</p>
            <p className="text-lg font-bold text-red-600">
              {metrics.worstTrade.lossPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.worstTrade.symbol}
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diversity Score */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Diversity</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{diversityScore.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {diversityScore > 70
                  ? "Well diversified"
                  : diversityScore > 40
                  ? "Moderate diversity"
                  : "Highly concentrated"}
              </p>
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="text-xl font-bold">{Math.round(diversityScore)}%</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        {riskAssessment && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold capitalize ${getRiskColor()}`}>
                  {riskAssessment.riskLevel}
                </p>
                <ul className="text-xs text-muted-foreground mt-3 space-y-1">
                  {riskAssessment.reasons.map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-xl font-bold">{riskAssessment.score}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Performers */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performers</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Best Performer</p>
            <p className="text-lg font-bold text-green-600">
              {metrics.bestPerformer.symbol}
            </p>
            <p className="text-sm text-green-600">
              +{metrics.bestPerformer.gainPercent.toFixed(1)}%
            </p>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Worst Performer</p>
            <p className="text-lg font-bold text-red-600">
              {metrics.worstPerformer.symbol}
            </p>
            <p className="text-sm text-red-600">
              {metrics.worstPerformer.lossPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
