import { TransactionRecord } from "./transactionHistory";
import { getTokenPrice } from "./transactionHistory";

export interface TokenTrade {
  symbol: string;
  tokenAddress: string;
  chainId: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  currentValue: number;
  totalCost: number;
  unrealizedPNL: number;
  unrealizedPNLPercent: number;
  trades: TradeExecution[];
}

export interface TradeExecution {
  hash: string;
  type: "buy" | "sell";
  quantity: number;
  priceAtTime: number;
  totalValue: number;
  timestamp: number;
}

export interface PortfolioPNL {
  totalValue: number;
  totalCost: number;
  unrealizedPNL: number;
  unrealizedPNLPercent: number;
  realizedPNL: number;
  tokens: TokenTrade[];
}

/**
 * Parse transactions to identify buy/sell events
 */
export function parseTradesFromTransactions(
  transactions: TransactionRecord[]
): Map<string, TradeExecution[]> {
  const trades = new Map<string, TradeExecution[]>();

  for (const tx of transactions) {
    // Only process swaps and receives for now
    if (tx.transactionType !== "swap" && tx.transactionType !== "receive") {
      continue;
    }

    if (!tx.tokenAddress || !tx.tokenAmount) {
      continue;
    }

    const key = `${tx.tokenAddress}-${tx.chainId}`;

    if (!trades.has(key)) {
      trades.set(key, []);
    }

    const tradeList = trades.get(key)!;

    // Estimate price (would need actual swap data for accurate prices)
    const estimatedPrice = tx.transactionType === "receive" ? 0.01 : parseFloat(tx.valueFormatted) / parseFloat(tx.tokenAmount);

    tradeList.push({
      hash: tx.hash,
      type: tx.transactionType === "receive" ? "buy" : "sell",
      quantity: parseFloat(tx.tokenAmount),
      priceAtTime: estimatedPrice,
      totalValue: parseFloat(tx.tokenAmount) * estimatedPrice,
      timestamp: tx.timestamp,
    });
  }

  return trades;
}

/**
 * Calculate average entry price for a token
 */
export function calculateAverageEntryPrice(trades: TradeExecution[]): number {
  const buyTrades = trades.filter((t) => t.type === "buy");

  if (buyTrades.length === 0) {
    return 0;
  }

  const totalCost = buyTrades.reduce((sum, t) => sum + t.totalValue, 0);
  const totalQuantity = buyTrades.reduce((sum, t) => sum + t.quantity, 0);

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

/**
 * Calculate current holdings from trade history
 */
export function calculateCurrentHoldings(trades: TradeExecution[]): number {
  return trades.reduce((sum, t) => {
    return t.type === "buy" ? sum + t.quantity : sum - t.quantity;
  }, 0);
}

/**
 * Calculate realized PNL from completed trades
 */
export function calculateRealizedPNL(trades: TradeExecution[]): number {
  let quantity = 0;
  let pnl = 0;

  // Sort by timestamp
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  for (const trade of sortedTrades) {
    if (trade.type === "buy") {
      quantity += trade.quantity;
    } else {
      // Sell - calculate PNL
      const cost = quantity * (trade.priceAtTime / trade.priceAtTime); // Simplified
      pnl += trade.totalValue - cost;
      quantity -= trade.quantity;
    }
  }

  return pnl;
}

/**
 * Calculate portfolio PNL for all holdings
 */
export async function calculatePortfolioPNL(
  transactions: TransactionRecord[]
): Promise<PortfolioPNL> {
  const trades = parseTradesFromTransactions(transactions);

  const tokens: TokenTrade[] = [];
  let totalValue = 0;
  let totalCost = 0;
  let realizedPNL = 0;

  for (const [key, tradeList] of trades.entries()) {
    const [tokenAddress, chainId] = key.split("-");

    const averageEntryPrice = calculateAverageEntryPrice(tradeList);
    const currentHoldings = calculateCurrentHoldings(tradeList);
    const realized = calculateRealizedPNL(tradeList);

    if (currentHoldings <= 0) {
      realizedPNL += realized;
      continue;
    }

    // Get current price
    const currentPrice = await getTokenPrice(tokenAddress, chainId);

    if (currentPrice === null) {
      continue;
    }

    const tokenCost = averageEntryPrice * currentHoldings;
    const tokenValue = currentPrice * currentHoldings;
    const tokenPNL = tokenValue - tokenCost;
    const tokenPNLPercent = tokenCost > 0 ? (tokenPNL / tokenCost) * 100 : 0;

    tokens.push({
      symbol: tradeList[0].hash ? "TOKEN" : "UNKNOWN", // Would get from token metadata
      tokenAddress,
      chainId,
      quantity: currentHoldings,
      averageEntryPrice,
      currentPrice,
      currentValue: tokenValue,
      totalCost: tokenCost,
      unrealizedPNL: tokenPNL,
      unrealizedPNLPercent: tokenPNLPercent,
      trades: tradeList,
    });

    totalValue += tokenValue;
    totalCost += tokenCost;
  }

  const unrealizedPNL = totalValue - totalCost;
  const unrealizedPNLPercent = totalCost > 0 ? (unrealizedPNL / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    unrealizedPNL,
    unrealizedPNLPercent,
    realizedPNL,
    tokens: tokens.sort((a, b) => b.unrealizedPNL - a.unrealizedPNL),
  };
}

/**
 * Cache PNL calculations
 */
export function cachePNLData(
  walletAddress: string,
  chainId: string,
  pnl: PortfolioPNL
): void {
  const key = `portfolio_pnl_${walletAddress}_${chainId}`;
  localStorage.setItem(key, JSON.stringify({ data: pnl, timestamp: Date.now() }));
}

/**
 * Get cached PNL (if less than 10 minutes old)
 */
export function getCachedPNL(
  walletAddress: string,
  chainId: string
): PortfolioPNL | null {
  const key = `portfolio_pnl_${walletAddress}_${chainId}`;
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

  if (timestamp > tenMinutesAgo) {
    return data;
  }

  localStorage.removeItem(key);
  return null;
}
