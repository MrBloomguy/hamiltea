import { TokenHolding } from "./tokenHoldings";

export interface PortfolioSnapshot {
  timestamp: number;
  totalValueUSD: number;
  holdings: Array<{
    address: string;
    symbol: string;
    balanceFormatted: string;
    valueUSD: number;
  }>;
}

export interface PortfolioMetrics {
  totalValueUSD: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  allTimeChange: number;
  allTimeChangePercent: number;
  winRate: number;
  totalTrades: number;
  bestTrade: { symbol: string; gainPercent: number };
  worstTrade: { symbol: string; lossPercent: number };
  bestPerformer: { symbol: string; gainPercent: number };
  worstPerformer: { symbol: string; lossPercent: number };
}

export interface TradeRecord {
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: number;
  exitTime: number;
  gainLoss: number;
  gainLossPercent: number;
}

/**
 * Calculate PNL (Profit and Loss) between two portfolio snapshots
 */
export function calculatePNL(
  current: PortfolioSnapshot,
  previous: PortfolioSnapshot
): number {
  return current.totalValueUSD - previous.totalValueUSD;
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Generate portfolio metrics from snapshots
 */
export function generatePortfolioMetrics(
  snapshots: PortfolioSnapshot[],
  trades: TradeRecord[] = []
): PortfolioMetrics {
  if (snapshots.length === 0) {
    return {
      totalValueUSD: 0,
      dayChange: 0,
      dayChangePercent: 0,
      weekChange: 0,
      weekChangePercent: 0,
      monthChange: 0,
      monthChangePercent: 0,
      allTimeChange: 0,
      allTimeChangePercent: 0,
      winRate: 0,
      totalTrades: 0,
      bestTrade: { symbol: "", gainPercent: 0 },
      worstTrade: { symbol: "", lossPercent: 0 },
      bestPerformer: { symbol: "", gainPercent: 0 },
      worstPerformer: { symbol: "", lossPercent: 0 },
    };
  }

  const now = Date.now();
  const current = snapshots[snapshots.length - 1];
  const currentValue = current.totalValueUSD;

  // Get snapshots for different time periods
  const dayAgoSnapshot = snapshots.find((s) => s.timestamp > now - 24 * 60 * 60 * 1000);
  const weekAgoSnapshot = snapshots.find((s) => s.timestamp > now - 7 * 24 * 60 * 60 * 1000);
  const monthAgoSnapshot = snapshots.find((s) => s.timestamp > now - 30 * 24 * 60 * 60 * 1000);
  const firstSnapshot = snapshots[0];

  // Calculate changes
  const dayChange = dayAgoSnapshot
    ? calculatePNL(current, dayAgoSnapshot)
    : 0;
  const dayChangePercent = dayAgoSnapshot
    ? calculatePercentChange(currentValue, dayAgoSnapshot.totalValueUSD)
    : 0;

  const weekChange = weekAgoSnapshot
    ? calculatePNL(current, weekAgoSnapshot)
    : 0;
  const weekChangePercent = weekAgoSnapshot
    ? calculatePercentChange(currentValue, weekAgoSnapshot.totalValueUSD)
    : 0;

  const monthChange = monthAgoSnapshot
    ? calculatePNL(current, monthAgoSnapshot)
    : 0;
  const monthChangePercent = monthAgoSnapshot
    ? calculatePercentChange(currentValue, monthAgoSnapshot.totalValueUSD)
    : 0;

  const allTimeChange = calculatePNL(current, firstSnapshot);
  const allTimeChangePercent = calculatePercentChange(currentValue, firstSnapshot.totalValueUSD);

  // Trade statistics
  const winCount = trades.filter((t) => t.gainLoss > 0).length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  const bestTrade = trades.reduce(
    (best, trade) => (trade.gainLossPercent > best.gainLossPercent ? trade : best),
    trades[0] || { symbol: "", gainLossPercent: 0 }
  );

  const worstTrade = trades.reduce(
    (worst, trade) => (trade.gainLossPercent < worst.gainLossPercent ? trade : worst),
    trades[0] || { symbol: "", gainLossPercent: 0 }
  );

  // Performer analysis
  const performerMap: Record<string, number[]> = {};
  for (const snapshot of snapshots) {
    for (const holding of snapshot.holdings) {
      if (!performerMap[holding.symbol]) {
        performerMap[holding.symbol] = [];
      }
      performerMap[holding.symbol].push(holding.valueUSD);
    }
  }

  let bestPerformer = { symbol: "", gainPercent: 0 };
  let worstPerformer = { symbol: "", lossPercent: 0 };

  for (const [symbol, values] of Object.entries(performerMap)) {
    if (values.length >= 2) {
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const gainPercent = calculatePercentChange(lastValue, firstValue);

      if (gainPercent > bestPerformer.gainPercent) {
        bestPerformer = { symbol, gainPercent };
      }
      if (gainPercent < worstPerformer.lossPercent) {
        worstPerformer = { symbol, lossPercent: gainPercent };
      }
    }
  }

  return {
    totalValueUSD: currentValue,
    dayChange,
    dayChangePercent,
    weekChange,
    weekChangePercent,
    monthChange,
    monthChangePercent,
    allTimeChange,
    allTimeChangePercent,
    winRate,
    totalTrades: trades.length,
    bestTrade: bestTrade ? { symbol: bestTrade.symbol, gainPercent: bestTrade.gainLossPercent } : { symbol: "", gainPercent: 0 },
    worstTrade: worstTrade
      ? { symbol: worstTrade.symbol, lossPercent: worstTrade.gainLossPercent }
      : { symbol: "", lossPercent: 0 },
    bestPerformer,
    worstPerformer,
  };
}

/**
 * Store portfolio snapshot in localStorage
 */
export function savePortfolioSnapshot(
  walletAddress: string,
  snapshot: PortfolioSnapshot
): void {
  const key = `portfolio_snapshots_${walletAddress}`;
  const existing = localStorage.getItem(key);
  const snapshots: PortfolioSnapshot[] = existing ? JSON.parse(existing) : [];

  snapshots.push(snapshot);

  // Keep only last 90 days of snapshots
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const filtered = snapshots.filter((s) => s.timestamp > ninetyDaysAgo);

  localStorage.setItem(key, JSON.stringify(filtered));
}

/**
 * Get portfolio snapshots from localStorage
 */
export function getPortfolioSnapshots(walletAddress: string): PortfolioSnapshot[] {
  const key = `portfolio_snapshots_${walletAddress}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Calculate portfolio diversity score (0-100)
 * Higher = more diversified
 */
export function calculateDiversityScore(
  holdings: TokenHolding[]
): number {
  if (holdings.length === 0) return 0;

  // Calculate Herfindahl-Hirschman Index (HHI)
  const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.balanceFormatted), 0);

  if (totalValue === 0) return 0;

  let hhi = 0;
  for (const holding of holdings) {
    const percentage = parseFloat(holding.balanceFormatted) / totalValue;
    hhi += percentage * percentage;
  }

  // Convert HHI to diversity score (0-100)
  // HHI ranges from 1/n to 1, so we normalize it
  const minHHI = 1 / holdings.length;
  const diversityScore = ((1 - hhi) / (1 - minHHI)) * 100;

  return Math.max(0, Math.min(100, diversityScore));
}

/**
 * Identify asset allocation by category
 */
export function categorizeAssets(
  holdings: TokenHolding[]
): {
  stablecoins: TokenHolding[];
  nativeAssets: TokenHolding[];
  defiTokens: TokenHolding[];
  other: TokenHolding[];
} {
  const stablecoinSymbols = [
    "USDC",
    "USDT",
    "DAI",
    "USDP",
    "FRAX",
    "cUSDC",
    "gUSDC",
  ];
  const nativeSymbols = ["ETH", "WETH", "MATIC", "WMATIC", "ARB", "OP"];
  const defiSymbols = [
    "UNI",
    "AAVE",
    "COMP",
    "LIDO",
    "MKR",
    "CRV",
    "SUSHI",
    "CURVE",
  ];

  const categorized = {
    stablecoins: [] as TokenHolding[],
    nativeAssets: [] as TokenHolding[],
    defiTokens: [] as TokenHolding[],
    other: [] as TokenHolding[],
  };

  for (const holding of holdings) {
    if (stablecoinSymbols.includes(holding.symbol.toUpperCase())) {
      categorized.stablecoins.push(holding);
    } else if (nativeSymbols.includes(holding.symbol.toUpperCase())) {
      categorized.nativeAssets.push(holding);
    } else if (defiSymbols.includes(holding.symbol.toUpperCase())) {
      categorized.defiTokens.push(holding);
    } else {
      categorized.other.push(holding);
    }
  }

  return categorized;
}

/**
 * Risk assessment based on portfolio composition
 */
export function assessPortfolioRisk(
  holdings: TokenHolding[]
): {
  riskLevel: "low" | "medium" | "high";
  score: number;
  reasons: string[];
} {
  const categories = categorizeAssets(holdings);
  const totalCount = holdings.length;
  let riskScore = 0;
  const reasons: string[] = [];

  // Check stablecoin ratio
  const stablecoinRatio = categories.stablecoins.length / totalCount;
  if (stablecoinRatio > 0.5) {
    riskScore += 10; // Lower risk with stable coins
  } else if (stablecoinRatio < 0.1) {
    riskScore += 40; // Higher risk without stablecoins
    reasons.push("Low stablecoin allocation");
  }

  // Check concentration
  const diversityScore = calculateDiversityScore(holdings);
  if (diversityScore < 20) {
    riskScore += 40;
    reasons.push("Highly concentrated portfolio");
  } else if (diversityScore > 70) {
    riskScore += 10;
    reasons.push("Well diversified");
  }

  // Check number of holdings
  if (totalCount > 20) {
    riskScore += 15;
    reasons.push("Many holdings to manage");
  } else if (totalCount < 3) {
    riskScore += 35;
    reasons.push("Very few holdings");
  }

  const riskLevel = riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low";

  return {
    riskLevel,
    score: Math.min(100, riskScore),
    reasons,
  };
}
